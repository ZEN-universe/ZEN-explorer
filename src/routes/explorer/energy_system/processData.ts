import type { LegendItem } from '$components/SankeyDiagram.svelte';
import { nextColor, resetColorState } from '@/lib/colors';
import type Entries from '@/lib/entries';
import type { ActivatedSolution, Entry, PartialSankeyLink, Row, SankeyNode } from '@/lib/types';
import { getTransportEdges } from '@/lib/utils';

export type Component =
	| 'conversionInput'
	| 'conversionOutput'
	| 'storageCharge'
	| 'storageDischarge'
	| 'import'
	| 'export'
	| 'demand'
	| 'shedDemand'
	| 'storageInflow'
	| 'storageSpillage'
	| 'transport'
	| 'transportLoss';

export interface Selection {
	solution: ActivatedSolution | null;
	carriers: string[];
	nodes: string[];
	year: number;
	transportByNode: boolean;
}

export type Group =
	| 'carrier'
	| 'conversionTech'
	| 'storageTech'
	| 'inflow'
	| 'spillage'
	| 'import'
	| 'export'
	| 'shedDemand'
	| 'demand'
	| 'transportIn'
	| 'transportOut';

const EMPTY = { nodes: [], links: [], legend: [] };
const GREY = 'rgb(180,180,180)';

interface Context {
	data: Record<Component, Entries>;
	solution: ActivatedSolution;
	selection: Selection;
	units: Row[];
	carriers: string[];
	indexOfYear: number;
}

function getReferenceCarrier(solution: ActivatedSolution, technology: string): string {
	return solution.detail.reference_carrier[technology] || '';
}

function getUnit(units: Row[], carrier: string): string {
	const unitRow = units.find((row) => row['carrier'] === carrier) || {};
	return unitRow[0] || unitRow.units || '';
}

function createContext(
	selection: Selection,
	data: Record<Component, Entries | null>,
	units: Row[],
	carriers: string[],
	years: number[]
): Context | null {
	if (!selection.solution || Object.values(data).some((componentData) => componentData === null)) {
		return null;
	}

	const indexOfYear = years.indexOf(selection.year);
	if (indexOfYear === -1) return null;

	return {
		data: data as Record<Component, Entries>,
		solution: selection.solution,
		selection,
		units,
		carriers,
		indexOfYear
	};
}

function newNode(
	id: string,
	label: string,
	color: string,
	unit: string,
	unitSuffix: boolean = false,
	stickTo: 'left' | 'right' | null = null,
	showTotal: boolean = true,
	distinctRow: boolean = false
): Partial<SankeyNode> {
	return {
		id,
		label,
		color,
		unit,
		unitSuffix,
		stickTo,
		showTotal,
		distinctRow
	};
}

function buildNodes(ctx: Context): {
	nodesByGroup: Record<Group, Partial<SankeyNode>[]>;
	legend: LegendItem[];
} {
	const { solution, selection, units, carriers } = ctx;
	const storageTechs = solution.detail.system.set_storage_technologies || [];
	const conversionTechs = solution.detail.system.set_conversion_technologies || [];
	const transportTechs = solution.detail.system.set_transport_technologies || [];

	resetColorState();
	const colors: LegendItem[] = [];
	const referenceCarriers = solution.detail.reference_carrier;

	// Carrier nodes
	const carrierNodes = carriers
		.map((carrier) => {
			if (!selection.carriers.includes(carrier)) return null;
			const color = nextColor(carrier);
			colors.push({ color, carrier });
			return newNode(carrier, carrier, color, getUnit(units, carrier), true, null, true, true);
		})
		.filter((node) => node !== null);

	// Conversion technology nodes
	const conversionTechNodes = conversionTechs.map((tech) =>
		newNode(tech, tech, GREY, getUnit(units, referenceCarriers[tech]), false, null, false)
	);

	// Storage technology nodes
	const storageTechNodes = storageTechs.map((tech) =>
		newNode(tech, tech, GREY, getUnit(units, referenceCarriers[tech]), false, null, false)
	);

	// Inflow and spillage nodes for storage technologies
	const inflowNodes = storageTechs.map((tech) =>
		newNode(tech, tech + '_inflow', GREY, getUnit(units, referenceCarriers[tech]))
	);
	const spillageNodes = storageTechs.map((tech) => {
		const unit = getUnit(units, referenceCarriers[tech]);
		return newNode(tech, `${tech}_spillage`, GREY, unit, false, null, false);
	});

	// Import and export nodes
	let currentColor = nextColor();
	const importNodes = carriers.map((carrier) =>
		newNode(carrier, carrier + ' import', currentColor, getUnit(units, carrier), true, 'left')
	);
	currentColor = nextColor();
	const exportNodes = carriers.map((carrier) =>
		newNode(carrier, carrier + ' export', currentColor, getUnit(units, carrier), true, 'right')
	);

	// Demand nodes
	currentColor = nextColor();
	const shedDemandNodes = carriers.map((carrier) =>
		newNode(carrier, carrier + ' shed demand', currentColor, getUnit(units, carrier))
	);
	currentColor = nextColor();
	const demandNodes = carriers.map((carrier) =>
		newNode(carrier, carrier + ' demand', currentColor, getUnit(units, carrier), true, 'right')
	);

	// Transport nodes
	currentColor = nextColor();
	const transportInNodes = transportTechs.flatMap((tech) => {
		const unit = getUnit(units, referenceCarriers[tech]);
		if (selection.transportByNode) {
			return solution.detail.system.set_nodes.map((node) => {
				const label = `${tech} transport in from ${node}`;
				return newNode(`${tech}_${node}`, label, currentColor, unit, false, null, false);
			});
		} else {
			return [newNode(tech, `${tech} transport in`, currentColor, unit, false, null, false)];
		}
	});
	const transportOutNodes = transportTechs.flatMap((tech) => {
		const unit = getUnit(units, referenceCarriers[tech]);
		if (selection.transportByNode) {
			return solution.detail.system.set_nodes.map((node) => {
				const label = `${tech} transport out to ${node}`;
				return newNode(`${tech}_${node}`, label, currentColor, unit, false, null, false);
			});
		} else {
			return [newNode(tech, `${tech} transport out`, currentColor, unit, false, null, false)];
		}
	});

	return {
		nodesByGroup: {
			carrier: carrierNodes,
			conversionTech: conversionTechNodes,
			storageTech: storageTechNodes,
			inflow: inflowNodes,
			spillage: spillageNodes,
			import: importNodes,
			export: exportNodes,
			shedDemand: shedDemandNodes,
			demand: demandNodes,
			transportIn: transportInNodes,
			transportOut: transportOutNodes
		},
		legend: colors
	};
}

function appendNewLink(
	links: PartialSankeyLink[],
	sourceNodes: Partial<SankeyNode>[],
	sourceId: string,
	targetNodes: Partial<SankeyNode>[],
	targetId: string,
	indexOfYear: number,
	nodes: Record<Group, Partial<SankeyNode>[]>,
	units: Row[],
	subtract = 0
): (entry: Entry) => void {
	return (entry: Entry) => {
		let value = entry.data[indexOfYear] - subtract;
		if (Math.abs(value) < 5e-4) {
			value = 0;
		}

		const sourceNode = sourceNodes.find((node) => node.id === entry.index[sourceId]);
		const targetNode = targetNodes.find((node) => node.id === entry.index[targetId]);
		if (!sourceNode || !targetNode) {
			console.warn(
				'Missing source or target node',
				{ sourceNodes, targetNodes },
				{ sourceNode, targetNode },
				{ sourceId, targetId },
				entry.index
			);
			return;
		}

		let color = GREY;
		const carrierNode = nodes.carrier.find((node) => node.id === entry.index.carrier);
		if (carrierNode) {
			color = carrierNode.color || GREY;
		}

		links.push({
			source: sourceNode,
			target: targetNode,
			value,
			color,
			unit: getUnit(units, entry.index.carrier)
		});
	};
}

function addLinks(
	ctx: Context,
	links: PartialSankeyLink[],
	nodes: Record<Group, Partial<SankeyNode>[]>
) {
	const { data, solution, selection, units, indexOfYear } = ctx;

	const technology = solution.detail.system.set_technologies.filter((technology) => {
		const inputCarriers = solution.detail.carriers_input[technology] || [];
		const outputCarriers = solution.detail.carriers_output[technology] || [];
		const referenceCarrier = solution.detail.reference_carrier[technology];
		return (
			[...inputCarriers, ...outputCarriers].some((c) => selection.carriers.includes(c)) ||
			(referenceCarrier && selection.carriers.includes(referenceCarrier))
		);
	});
	const filterCriteria = {
		carrier: selection.carriers,
		node: selection.nodes,
		technology
	};

	function addCarrierToEntry(entry: Entry): void {
		const referenceCarrier = getReferenceCarrier(solution, entry.index.technology);
		if (!referenceCarrier) return;
		entry.index.carrier = referenceCarrier;
	}

	function _link(
		sourceNodes: Partial<SankeyNode>[],
		sourceId: string,
		targetNodes: Partial<SankeyNode>[],
		targetId: string,
		subtract = 0
	) {
		return (entry: Entry) => {
			appendNewLink(
				links,
				sourceNodes,
				sourceId,
				targetNodes,
				targetId,
				indexOfYear,
				nodes,
				units,
				subtract
			)(entry);
		};
	}

	// conversion input: carrier -> conversion tech
	data.conversionInput
		.filterByCriteria(filterCriteria)
		.groupBy(['technology', 'carrier'])
		.forEach(_link(nodes.carrier, 'carrier', nodes.conversionTech, 'technology'));
	// conversion output: conversion tech -> carrier
	data.conversionOutput
		.filterByCriteria(filterCriteria)
		.groupBy(['technology', 'carrier'])
		.forEach(_link(nodes.conversionTech, 'technology', nodes.carrier, 'carrier'));

	// storage charge: carrier -> storage tech
	data.storageCharge
		.filterByCriteria(filterCriteria)
		.groupBy(['technology'])
		.forEach((entry) => {
			const referenceCarrier = getReferenceCarrier(solution, entry.index.technology);
			if (!referenceCarrier) return;
			entry.index.carrier = referenceCarrier;
		})
		.forEach(_link(nodes.carrier, 'carrier', nodes.storageTech, 'technology'));
	// storage discharge: storage tech -> carrier
	data.storageDischarge
		.filterByCriteria(filterCriteria)
		.groupBy(['technology'])
		.forEach(addCarrierToEntry)
		.forEach(_link(nodes.storageTech, 'technology', nodes.carrier, 'carrier'));

	// storage inflow: inflow -> storage tech
	data.storageInflow
		.filterByCriteria(filterCriteria)
		.groupBy(['technology'])
		.forEach(addCarrierToEntry)
		.forEach(_link(nodes.inflow, 'technology', nodes.storageTech, 'technology'));
	// storage spillage: storage tech -> spillage
	data.storageSpillage
		.filterByCriteria(filterCriteria)
		.groupBy(['technology'])
		.forEach(addCarrierToEntry)
		.forEach(_link(nodes.storageTech, 'technology', nodes.spillage, 'technology'));

	// import: import -> carrier
	data.import
		.filterByCriteria(filterCriteria)
		.groupBy(['carrier'])
		.forEach(_link(nodes.import, 'carrier', nodes.carrier, 'carrier'));
	// export: carrier -> export
	data.export
		.filterByCriteria(filterCriteria)
		.groupBy(['carrier'])
		.forEach(_link(nodes.carrier, 'carrier', nodes.export, 'carrier'));

	// shed demand: shed demand -> demand
	const aggregatedShedDemand = data.shedDemand
		.filterByCriteria(filterCriteria)
		.groupBy(['carrier']);
	aggregatedShedDemand.forEach(_link(nodes.shedDemand, 'carrier', nodes.demand, 'carrier'));
	// demand minus shed demand: carrier -> demand
	data.demand
		.filterByCriteria(filterCriteria)
		.groupBy(['carrier'])
		.forEach((entry) => {
			const shedEntry = aggregatedShedDemand.find((e) => e.index.carrier === entry.index.carrier);
			const shedValue = shedEntry ? shedEntry.data[indexOfYear] : 0;
			_link(nodes.carrier, 'carrier', nodes.demand, 'carrier', shedValue)(entry);
		});

	// transport in = transport - transport loss: transport in -> carrier:
	const transportInEdges = getTransportEdges(solution.detail.edges, selection.nodes, true);
	const aggregatedTransportIn = data.transportLoss
		.filterByCriteria({
			...filterCriteria,
			edge: transportInEdges
		})
		.mapIndex((index) => {
			return {
				id: selection.transportByNode
					? `${index.technology}_${index.edge.split('-')[0]}`
					: index.technology
			};
		})
		.groupBy(selection.transportByNode ? ['technology', 'node'] : ['technology']);
	data.transport
		.filterByCriteria({
			...filterCriteria,
			edge: transportInEdges
		})
		.mapIndex((index) => {
			return {
				id: selection.transportByNode
					? `${index.technology}_${index.edge.split('-')[0]}`
					: index.technology,
				technology: index.technology
			};
		})
		.groupBy(['id', 'technology'])
		.forEach(addCarrierToEntry)
		.forEach((entry) => {
			const lossEntry = aggregatedTransportIn.find((e) => e.index.id === entry.index.id);
			const lossValue = lossEntry ? lossEntry.data[indexOfYear] : 0;
			_link(nodes.transportIn, 'id', nodes.carrier, 'carrier', lossValue)(entry);
		});
	// transport out = transport: carrier -> transport out
	data.transport
		.filterByCriteria({
			...filterCriteria,
			edge: getTransportEdges(solution.detail.edges, selection.nodes, false)
		})
		.mapIndex((index) => {
			return {
				id: selection.transportByNode
					? `${index.technology}_${index.edge.split('-')[1]}`
					: index.technology,
				technology: index.technology
			};
		})
		.groupBy(['id', 'technology'])
		.forEach(addCarrierToEntry)
		.forEach(_link(nodes.carrier, 'carrier', nodes.transportOut, 'id'));
}

export function computeSankeyData(
	selection: Selection,
	data: Record<Component, Entries | null>,
	units: Row[],
	carriers: string[],
	years: number[]
): { nodes: Partial<SankeyNode>[]; links: PartialSankeyLink[]; legend: LegendItem[] } {
	const ctx = createContext(selection, data, units, carriers, years);
	if (!ctx) {
		return EMPTY;
	}

	// Stage 1: Define nodes
	const { nodesByGroup: nodes, legend } = buildNodes(ctx);

	// Stage 2: Define links
	const links: PartialSankeyLink[] = [];
	addLinks(ctx, links, nodes);

	const sankeyNodes = Object.values(nodes).flatMap((group) => group);
	const sankeyLinks = links;
	return { nodes: sankeyNodes, links: sankeyLinks, legend };
}
