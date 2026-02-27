import { draw as drawPattern } from 'patternomaly';
import type { ChartDataset } from 'chart.js';

import type { ColorBoxItem } from '$components/ColorBox.svelte';
import { nextColor, addTransparency, resetColorState } from '@/lib/colors';
import { createColorBoxItem, nextPattern, resetPatternState } from '@/lib/patterns';
import type { FilterCriteria } from '@/lib/entries';
import type Entries from '@/lib/entries';
import type { ShapeType } from '@/lib/patterns';
import type { ActivatedSolution } from '@/lib/types';
import { generateSolutionSuffix } from '@/lib/compareSolutions.svelte';

export type Variable = 'capacity' | 'capacity_addition';
export type TechnologyType = 'conversion' | 'storage' | 'transport';
export type StorageType = 'energy' | 'power';
export type AggregationOption = 'node' | 'technology';

function generateDatasetsForSolution(
	data: Entries,
	solutionName: string,
	pattern: ShapeType | undefined,
	locations: string[],
	technologies: string[],
	years: number[],
	selectedAggregation: AggregationOption,
	selectedTechnologies: string[],
	selectedLocations: string[],
	selectedTechnologyType: TechnologyType,
	selectedStorageType: StorageType,
	selectedYears: string[],
	selectedNormalization: boolean
): ChartDataset<'bar'>[] {
	const filterCriteria: FilterCriteria = {};
	const groupByColumns: string[] = ['capacity_type'];

	if (selectedAggregation == 'technology') {
		// aggregate by technology
		filterCriteria['technology'] = selectedTechnologies;
		filterCriteria['location'] = locations;
		groupByColumns.push('location');
	} else {
		// aggregate by location (node)
		filterCriteria['location'] = selectedLocations;
		filterCriteria['technology'] = technologies;
		groupByColumns.push('technology');
	}

	if (selectedTechnologyType == 'storage') {
		filterCriteria['capacity_type'] = [selectedStorageType];
	}

	let entries = data
		.filterByCriteria(filterCriteria)
		.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))))
		.groupBy(groupByColumns);

	if (selectedNormalization) {
		entries = entries.normalize();
	}

	return entries.toArray().map((entry) => {
		const label =
			selectedAggregation === 'technology' ? entry.index.location : entry.index.technology;
		const color = nextColor(label);
		return {
			label,
			data: entry.data,
			borderColor: color,
			backgroundColor:
				pattern !== undefined
					? drawPattern(pattern, addTransparency(color))
					: addTransparency(color),
			stack: solutionName
		} as ChartDataset<'bar'>;
	});
}

export function computeDatasets(
	fetchedEntries: Entries[],
	locations: string[],
	technologies: string[],
	years: number[],
	selectedSolutions: (ActivatedSolution | null)[],
	selectedYears: string[],
	selectedTechnologies: string[],
	selectedLocations: string[],
	selectedTechnologyType: TechnologyType,
	selectedStorageType: StorageType,
	selectedAggregation: AggregationOption,
	selectedNormalization: boolean
): [ChartDataset<'bar'>[], ColorBoxItem[]] {
	if (
		selectedTechnologyType == null ||
		selectedLocations.length == 0 ||
		selectedYears.length == 0 ||
		selectedTechnologies.length == 0 ||
		fetchedEntries.length === 0
	) {
		return [[], []];
	}

	resetColorState();
	resetPatternState();
	const patterns: ColorBoxItem[] = [];
	const datasets: ChartDataset<'bar'>[] = selectedSolutions.flatMap((solution, index) => {
		if (solution === null || !fetchedEntries[index]?.length) return [];

		const suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
		const pattern = index > 0 ? nextPattern() : undefined;
		patterns.push(createColorBoxItem(suffix, pattern));
		return generateDatasetsForSolution(
			fetchedEntries[index],
			suffix,
			pattern,
			locations,
			technologies,
			years,
			selectedAggregation,
			selectedTechnologies,
			selectedLocations,
			selectedTechnologyType,
			selectedStorageType,
			selectedYears,
			selectedNormalization
		);
	});

	return [datasets, patterns];
}
