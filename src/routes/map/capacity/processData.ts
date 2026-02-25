import type { MapPlotData } from '$components/MapPlot.svelte';
import Entries, { type FilterCriteria } from '@/lib/entries';
import type { ActivatedSolution } from '@/lib/types';

export type TechnologyType = 'conversion' | 'storage';
export type StorageType = 'energy' | 'power';

export function computePieData(
	fetchedData: Entries | null,
	years: number[],
	selectedTechnologies: string[],
	selectedYear: string | null,
	selectedStorageType: StorageType,
	selectedTechnologyType: TechnologyType
): [MapPlotData | null, number, number] {
	if (!fetchedData || !selectedTechnologyType || !selectedYear) {
		return [null, 0, 0];
	}

	// Filter data
	const criteria: FilterCriteria = { technology: selectedTechnologies };
	if (selectedTechnologyType === 'storage') {
		criteria['capacity_type'] = [selectedStorageType];
	}
	const data = fetchedData.filterByCriteria(criteria);

	// Compute map plot data
	const index = years.findIndex((year) => year.toString() === selectedYear);
	const mapPlotData = data
		.filterDataByIndex([index])
		.filter(({ data: [d] }) => d > 1e-6)
		.reduce((acc, { index: { location, technology }, data: [value] }) => {
			acc[location] = acc[location] || [];
			acc[location].push({ technology, value });
			return acc;
		}, {} as MapPlotData);

	// Compute min and max total values across all locations over all years for the selected technologies
	const [minTotal, maxTotal] = data.groupBy(['location'], 'sum').reduce(
		([accMin, accMax], { data }) => {
			const maxValue = data.reduce((acc, val) => Math.max(acc, val), 0);
			return [Math.min(accMin, maxValue), Math.max(accMax, maxValue)];
		},
		[Number.MAX_SAFE_INTEGER, 0]
	);

	return [mapPlotData, minTotal, maxTotal];
}

export function computeLineData(
	fetchedData: Entries | null,
	years: number[],
	selectedSolution: ActivatedSolution | null,
	selectedCarrier: string | null,
	selectedYear: string | null
): [MapPlotData | null, number, number] {
	if (!fetchedData || !selectedSolution || !selectedYear) {
		return [null, 0, 0];
	}

	// Filter data for transport technologies corresponding to the selected carrier
	const transportTechnologies = selectedSolution.detail.system.set_transport_technologies.filter(
		(technology) => selectedSolution!.detail.reference_carrier[technology] == selectedCarrier
	);
	const criteria: FilterCriteria = { technology: transportTechnologies };
	const data = fetchedData.filterByCriteria(criteria);

	// Compute map plot data
	const index = years.findIndex((year) => year.toString() === selectedYear);
	const mapPlotData = data
		.filterDataByIndex([index])
		.filter(({ data: [d] }) => d > 1e-6)
		.reduce((acc, { index: { location, technology }, data }) => {
			acc[location] = acc[location] || [];
			acc[location].push({ technology, value: data[0] });
			return acc;
		}, {} as MapPlotData);

	// Compute min and max maximal value across all edges over all years for the selected carrier
	const [minEdge, maxEdge] = data.groupBy(['location'], 'max').reduce(
		([accMin, accMax], { data }) => {
			const maxValue = data.reduce((acc, val) => Math.max(acc, val), 0);
			return [Math.min(accMin, maxValue), Math.max(accMax, maxValue)];
		},
		[Number.MAX_SAFE_INTEGER, 0]
	);

	return [mapPlotData, minEdge, maxEdge];
}
