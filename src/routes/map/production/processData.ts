import type { MapPlotData } from '$components/MapPlot.svelte';
import Entries from '@/lib/entries';
import type { FilterCriteria } from '@/lib/entries';
import { variables, type ProductionComponent } from '@/lib/productionData';
import type { ActivatedSolution } from '@/lib/types';
import { getTransportEdges, typedEntries } from '@/lib/utils';

export type EnergyType = 'production' | 'consumption';

export function computePieData(
	productionData: Record<ProductionComponent, Entries> | null,
	years: number[],
	selectedSolution: ActivatedSolution | null,
	selectedCarrier: string | null,
	selectedEnergyType: EnergyType,
	selectedYear: string | null
): [MapPlotData | null, number, number] {
	if (!selectedSolution || !selectedCarrier || !productionData || !selectedEnergyType) {
		return [null, 0, 0];
	}

	const filterCriteria: FilterCriteria = {
		carrier: [selectedCarrier]
	};
	const prodData = productionData;
	const isProduction = selectedEnergyType === 'production';
	const entriesList = typedEntries(variables).map(([id, variable]) => {
		let curData = prodData[isProduction ? variable.positive : variable.negative];
		const label = isProduction ? variable.positiveLabel : variable.negativeLabel;
		const suffix = isProduction ? variable.positiveSuffix : variable.negativeSuffix;

		if (id === 'transport') {
			curData = computeTransportDataPerNode(
				prodData[variable.positive],
				prodData[variable.negative],
				isProduction,
				selectedSolution!.detail.system.set_nodes,
				selectedSolution!.detail.edges
			);
		}

		return curData.filterByCriteria(filterCriteria).mapIndex((index) => {
			if (index.technology === undefined) {
				index.technology = label;
			} else if (suffix) {
				index.technology = index.technology + suffix;
			}
			return index;
		});
	});
	const data = Entries.concatenate(entriesList);

	const index = years.findIndex((year) => year.toString() === selectedYear);
	const mapPlotData = data
		.filterDataByIndex([index])
		.filter(({ data: [d] }) => d > 1e-6)
		.reduce((acc: MapPlotData, { index: { node, technology }, data: [value] }) => {
			acc[node] = acc[node] || [];
			acc[node].push({ technology, value });
			return acc;
		}, {} as MapPlotData);

	const [minTotal, maxTotal] = data.groupBy(['node']).reduce(
		([accMin, accMax], { data: values }) => {
			const total = values.reduce((acc, val) => Math.max(acc, val), 0);
			return [Math.min(accMin, total), Math.max(accMax, total)];
		},
		[Number.MAX_SAFE_INTEGER, 0]
	);

	return [mapPlotData, minTotal, maxTotal];
}

function computeTransportDataPerNode(
	positiveData: Entries,
	negativeData: Entries,
	onlyIncoming: boolean,
	nodes: string[],
	edges: Record<string, string>
): Entries {
	// for each node, find all incoming and outgoing edges and sum the transport data for those edges to get total transport in and out of the node per technology
	const entries = nodes.flatMap((node) => {
		const outgoingEdges = getTransportEdges(edges, [node], false);

		let entries;
		if (onlyIncoming) {
			const incomingEdges = getTransportEdges(edges, [node], true);
			const transportGains = positiveData.filterByCriteria({
				edge: incomingEdges
			});
			const transportLosses = negativeData.filterByCriteria({
				edge: incomingEdges
			});
			entries = transportGains
				.mapEntries((index, data) => {
					const lossData = transportLosses.find(
						(entry) =>
							entry.index.edge === index.edge && entry.index.technology === index.technology
					)?.data;
					if (!lossData || lossData.length !== data.length) {
						return { data, index };
					}
					return { data: data.map((n, i) => n - lossData[i]), index };
				})
				.groupBy(['technology'])
				.mapIndex((index) => ({ ...index, node }));
		} else {
			entries = positiveData.filterByCriteria({
				edge: outgoingEdges
			});
		}

		return entries.groupBy(['technology']).mapIndex((index) => ({ ...index, node }));
	});

	return Entries.concatenate(entries);
}

export function computeLineData(
	productionData: Record<ProductionComponent, Entries> | null,
	years: number[],
	selectedSolution: ActivatedSolution | null,
	selectedYear: string | null
): [MapPlotData | null, number, number] {
	if (!selectedSolution || !productionData) {
		return [null, 0, 0];
	}

	const yearIndex = years.findIndex((year) => year.toString() === selectedYear);
	const entries = productionData.flow_transport.reduce((acc, { index, data }) => {
		acc[index.edge] = acc[index.edge] || [];
		acc[index.edge].push({ technology: index.technology, value: data[yearIndex] });
		return acc;
	}, {} as MapPlotData);

	const [minEdge, maxEdge] = productionData.flow_transport.groupBy(['edge'], 'max').reduce(
		([accMin, accMax], { data }) => {
			const total = data.reduce((acc, val) => Math.max(acc, val), 0);
			return [Math.min(accMin, total), Math.max(accMax, total)];
		},
		[Number.MAX_SAFE_INTEGER, 0]
	);

	return [entries, minEdge, maxEdge];
}
