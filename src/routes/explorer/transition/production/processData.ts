import { draw as drawPattern } from 'patternomaly';
import Entries, { type FilterCriteria } from '$lib/entries';
import type { ColorBoxItem } from '$components/ColorBox.svelte';
import { variables, type ProductionComponent, type VariableId } from '$lib/productionData';
import type { ActivatedSolution } from '$lib/types';
import type { ChartDataset } from 'chart.js';
import { getInboundEdges, getTransportEdges, typedEntries } from '$lib/utils';
import { addTransparency, nextColor, resetColorState } from '$lib/colors';
import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
import { generateSolutionSuffix } from '$lib/compareSolutions.svelte';

export type Data = Record<ProductionComponent, Entries>;

export interface Selection {
	solutions: (ActivatedSolution | null)[];
	carrier: string | null;
	showVariable: Record<VariableId, boolean>;
	byTechnology: Partial<Record<VariableId, boolean>>;
	byNode: Partial<Record<VariableId, boolean>>;
	conversionTechnologies: string[];
	storageTechnologies: string[];
	transportTechnologies: string[];
	nodes: string[];
	years: string[];
	normalization: boolean;
}

// Process plot data
function processData(
	selection: Selection,
	initialEntries: Entries,
	years: number[],
	groupedByTechnology: boolean,
	filterByTechnologies: boolean,
	label: string,
	suffix: string = '',
	map_fn: (d: number) => number = (d) => d
): Entries {
	if (!selection.carrier) {
		return Entries.empty;
	}

	const filterCriteria: FilterCriteria = {
		carrier: [selection.carrier],
		node: selection.nodes
	};
	if (filterByTechnologies) {
		filterCriteria['technology'] = [
			...selection.conversionTechnologies,
			...selection.storageTechnologies,
			...selection.transportTechnologies
		];
	}
	const groupByColumns = groupedByTechnology ? ['technology'] : [];

	let entries = initialEntries
		.filterByCriteria(filterCriteria)
		.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))))
		.groupBy(groupByColumns)
		.mapIndex((index) => ({
			...index,
			label: groupedByTechnology ? index.technology + suffix : label
		}));

	if (map_fn !== undefined) {
		entries = entries.mapData(map_fn);
	}

	return entries;
}

function processTransportData(
	selection: Selection,
	flowTransport: Entries,
	flowTransportLoss: Entries,
	years: number[],
	groupedByTechnology: boolean,
	groupedByNode: boolean,
	edges: Record<string, string>
): Entries[] {
	const outgoingEdges = getTransportEdges(edges, selection.nodes, false);
	const incomingEdges = getTransportEdges(edges, selection.nodes, true);
	const inboundEdges = getInboundEdges(edges, selection.nodes);

	// transport_in are all incoming flows, calculated as transport gain - transport loss
	const transportGains = flowTransport.filterByCriteria({
		technology: selection.transportTechnologies,
		edge: incomingEdges
	});
	const transportLosses = flowTransportLoss.filterByCriteria({
		technology: selection.transportTechnologies,
		edge: incomingEdges
	});
	let positiveData = transportGains
		.mapEntries((index, data) => {
			// Find loss entry with the same technology and edge
			const lossData = transportLosses.find(
				(entry) => entry.index.technology === index.technology && entry.index.edge === index.edge
			)?.data;
			// If no corresponding loss data is found, return the original gain data
			if (!lossData || lossData.length !== data.length) return { index, data };
			// Subtract loss data from gain data
			return { data: data.map((n, i) => n - lossData[i]), index };
		})
		.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))));

	// transport_out are all outgoing flows
	let negativeData = flowTransport
		.filterByCriteria({
			technology: selection.transportTechnologies,
			edge: outgoingEdges
		})
		.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))));

	// compute transport loss within the selected nodes
	let internalTransportLoss = flowTransportLoss
		.filterByCriteria({
			technology: selection.transportTechnologies,
			edge: inboundEdges
		})
		.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))));

	// Generate labels based on grouping options
	if (groupedByNode) {
		positiveData = positiveData.mapIndex((index) => {
			const [fromNode] = index.edge.split('-');
			const label = groupedByTechnology
				? `${index.technology} (transport in from ${fromNode})`
				: `Transport in (from ${fromNode})`;
			return {
				...index,
				label
			};
		});
		negativeData = negativeData.mapIndex((index) => {
			const [, toNode] = index.edge.split('-');
			const label = groupedByTechnology
				? `${index.technology} (transport out to ${toNode})`
				: `Transport out (to ${toNode})`;
			return {
				...index,
				label
			};
		});
		internalTransportLoss = internalTransportLoss.mapIndex((index) => {
			const label = groupedByTechnology
				? `${index.technology} (internal transport loss)`
				: `Internal transport loss`;
			return {
				...index,
				label
			};
		});
	} else {
		positiveData = positiveData.mapIndex((index) => {
			const label = groupedByTechnology ? `${index.technology} (transport in)` : `Transport in`;
			return {
				...index,
				label
			};
		});
		negativeData = negativeData.mapIndex((index) => {
			const label = groupedByTechnology ? `${index.technology} (transport out)` : `Transport out`;
			return {
				...index,
				label
			};
		});
		internalTransportLoss = internalTransportLoss.mapIndex((index) => {
			const label = groupedByTechnology
				? `${index.technology} (internal transport loss)`
				: `Internal transport loss`;
			return {
				...index,
				label
			};
		});
	}

	// Group by label and negate values for negative data and transport loss
	positiveData = positiveData.groupBy(['label']);
	negativeData = negativeData.mapData((d) => -d).groupBy(['label']);
	internalTransportLoss = internalTransportLoss.mapData((d) => -d).groupBy(['label']);

	return [positiveData, negativeData, internalTransportLoss];
}

export function generateDatasetsAndPatterns(
	data: Data[],
	selection: Selection,
	years: number[]
): [ChartDataset<'bar'>[], ColorBoxItem[]] {
	if (selection.nodes.length == 0 || selection.years.length == 0 || data.length == 0) {
		return [[], []];
	}

	resetColorState();
	resetPatternState();
	const patterns: ColorBoxItem[] = [];
	const datasets: ChartDataset<'bar'>[] = selection.solutions.flatMap((solution, i) => {
		const rows = data[i];
		if (!solution || !Object.keys(rows).length) {
			return [];
		}

		// Process data for each variable and concatenate the resulting entries.
		const entriesList: Entries[] = typedEntries(variables).flatMap(([id, variable]) => {
			if (!selection.showVariable[id]) {
				return [];
			}

			const positiveData = rows[variable.positive];
			const negativeData = rows[variable.negative];

			// Handle transport data
			if (id === 'transport') {
				return processTransportData(
					selection,
					positiveData,
					negativeData,
					years,
					selection.byTechnology[id] ?? false,
					selection.byNode[id] ?? false,
					solution.detail.edges
				);
			}

			const filteredPos: Entries = processData(
				selection,
				positiveData,
				years,
				selection.byTechnology[id] ?? false,
				variable.filterByTechnologies,
				variable.positiveLabel,
				variable.positiveSuffix
			);
			const filteredNeg: Entries = processData(
				selection,
				negativeData,
				years,
				selection.byTechnology[id] ?? false,
				variable.filterByTechnologies,
				variable.negativeLabel,
				variable.negativeSuffix,
				(d) => -d
			);

			return [filteredPos, filteredNeg];
		});
		let entries = Entries.concatenate(entriesList);

		// Normalize if selected
		if (selection.normalization) {
			entries = entries.normalize();
		}

		// Convert to dataset format
		const suffix = generateSolutionSuffix(solution);
		const pattern = i > 0 ? nextPattern() : undefined;
		patterns.push(createColorBoxItem(suffix, pattern));
		return entries.toArray().map((entry) => {
			const label = entry.index.label;
			const color = nextColor(label);
			return {
				label,
				data: entry.data,
				borderColor: color,
				backgroundColor:
					pattern !== undefined
						? drawPattern(pattern, addTransparency(color))
						: addTransparency(color),
				stack: suffix
			} as ChartDataset<'bar'>;
		});
	});

	return [datasets, patterns];
}
