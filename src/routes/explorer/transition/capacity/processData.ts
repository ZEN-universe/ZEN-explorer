import { draw as drawPattern } from 'patternomaly';
import type { ChartDataset } from 'chart.js';

import type { ColorBoxItem } from '$components/ColorBox.svelte';
import { nextColor, addTransparency, resetColorState } from '@/lib/colors';
import { createColorBoxItem, nextPattern, resetPatternState } from '@/lib/patterns';
import type { FilterCriteria } from '@/lib/entries';
import Entries from '@/lib/entries';
import type { ShapeType } from '@/lib/patterns';
import type { ActivatedSolution, Index } from '@/lib/types';
import { generateSolutionSuffix } from '@/lib/compareSolutions.svelte';

export type Variable = 'capacity' | 'capacity_addition';
export type TechnologyType = 'conversion' | 'storage' | 'transport';
export type StorageType = 'energy' | 'power';
export type AggregationOption = 'node' | 'technology';

export interface Data {
	capacity: Entries[];
	capacity_addition: Entries[];
	capacity_previous: Entries[];
}

export interface Selection {
	solutions: (ActivatedSolution | null)[];
	variable: Variable;
	technologyType: TechnologyType;
	storageType: StorageType;
	carrier: string | null;
	aggregation: AggregationOption;
	normalization: boolean;
	locations: string[];
	technologies: string[];
	years: string[];
}

/**
 * Iterate over all valid solutions in the selection and execute the callback for each of them.
 * A solution is valid if it is not null and if there is data for all required components (e.g., capacity, capacity_addition, etc.) for that solution.
 *
 * @param data - the data object containing all entries for capacity, capacity_addition, and capacity_previous for each solution.
 * @param selection - the current selection containing the activated solutions and other parameters.
 * @param patterns - an array to which the function will push the generated patterns for each valid solution, which can be used for the color box legend.
 * @param components - the required components that must have data for a solution to be considered valid (e.g., ['capacity', 'capacity_addition']).
 * @param callback - a function that will be called for each valid solution, receiving the solution name, the pattern for that solution, and the index of the solution in the selection.
 *  The callback should return an array of ChartDataset objects for that solution, which will be combined and returned by this function.
 * @returns an array of ChartDataset objects for all valid solutions, combined from the results of the callback function for each solution.
 */
export function forEachValidSolution(
	data: Data,
	selection: Selection,
	patterns: ColorBoxItem[],
	components: (keyof Data)[],
	callback: (
		solutionName: string,
		pattern: ShapeType | undefined,
		idx: number
	) => ChartDataset<'bar'>[]
): ChartDataset<'bar'>[] {
	return selection.solutions.flatMap((solution, index) => {
		if (solution === null || components.some((component) => !data[component][index]?.length)) {
			return [];
		}

		const solutionName = generateSolutionSuffix(solution);
		const pattern = index > 0 ? nextPattern() : undefined;
		patterns.push(createColorBoxItem(solutionName, pattern));

		return callback(solutionName, pattern, index);
	});
}

/**
 * Filter and group the data based on the selection criteria.
 * The function first determines the filter criteria and grouping columns based on the aggregation option (technology or node) and the technology type (storage or conversion).
 * Then it filters the data by the determined criteria, filters by the selected years, and groups by the determined columns.
 *
 * @param data - the Entries object containing the data to be filtered and grouped.
 * @param selection - the current selection containing the aggregation option, technology type, storage type, and selected years, among other parameters.
 * @param locations - the list of all available locations, which will be used for filtering and grouping based on the aggregation option.
 * @param technologies - the list of all available technologies, which will be used for filtering and grouping based on the aggregation option.
 * @param years - the list of all available years, which will be used for filtering the data by the selected years.
 * @returns a new Entries object that has been filtered by the determined criteria, filtered by the selected years, and grouped by the determined columns.
 */
function filterAndGroupData(
	data: Entries,
	selection: Selection,
	locations: string[],
	technologies: string[],
	years: number[]
): Entries {
	const filterCriteria: FilterCriteria = {};
	const groupByColumns: string[] = ['capacity_type'];

	if (selection.aggregation == 'technology') {
		// aggregate all technologies, i.e., keep the locations
		filterCriteria['technology'] = selection.technologies;
		filterCriteria['location'] = locations;
		groupByColumns.push('location');
	} else {
		// aggregate all locations, i.e., keep the technologies
		filterCriteria['location'] = selection.locations;
		filterCriteria['technology'] = technologies;
		groupByColumns.push('technology');
	}

	if (selection.technologyType == 'storage') {
		filterCriteria['capacity_type'] = [selection.storageType];
	}

	return data
		.filterByCriteria(filterCriteria)
		.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))))
		.groupBy(groupByColumns);
}

/**
 * Convert the filtered and grouped entries into ChartDataset objects for the bar chart.
 * The function first normalizes the entries if the normalization option is selected in the selection.
 * Then it maps each entry to a ChartDataset object, where the label is determined by the aggregation option (technology or node), and the color is determined by the label using the nextColor function.
 * If a pattern is provided, it uses the drawPattern function to create a patterned background color for the dataset; otherwise, it uses a transparent version of the color.
 *
 * @param entries - the Entries object containing the filtered and grouped data to be converted into ChartDataset objects.
 * @param selection - the current selection containing the aggregation option, normalization option, and other parameters that may affect how the datasets are generated.
 * @param solutionName - the name of the solution for which the datasets are being generated, which will be used as the stack identifier for the datasets.
 * @param pattern - an optional pattern to be used for the background color of the datasets; if not provided, a transparent color will be used.
 * @param labelSuffix - an optional suffix to be added to the dataset labels, which can be used to differentiate between different types of datasets (e.g., addition vs. retirement).
 * @returns an array of ChartDataset objects that can be used for the bar chart, where each dataset corresponds to a combination of technology and location (or just technology or location, depending on the aggregation option) and is colored according to the solution and pattern.
 */
function entriesToDatasets(
	entries: Entries,
	selection: Selection,
	solutionName: string,
	pattern: ShapeType | undefined,
	labelSuffix: string = ''
): ChartDataset<'bar'>[] {
	if (selection.normalization) {
		entries = entries.normalize();
	}

	return entries.toArray().map((entry) => {
		const label =
			selection.aggregation === 'technology' ? entry.index.location : entry.index.technology;
		const color = nextColor(label);
		return {
			label: label + labelSuffix,
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

/**
 * Generate a simple hash for the given columns and index.
 * @param columns - the columns to include in the hash
 * @param index - the index to hash
 * @returns the hash string
 */
function hash(columns: string[], index: Index): string {
	return Object.entries(index)
		.filter(([k]) => columns.includes(k))
		.map(([, v]) => v)
		.join(',');
}

/**
 * Compute the retirement data by comparing the capacity entries with the previous capacity entries.
 * For each entry in capacity, it finds the corresponding entry in capacity_previous based on the combination of technology, capacity_type, and location.
 * The retired capacity in a timestep t is the difference between capacity_previous at timestep t and capacity at timestep t-1.
 * This difference cannot be (significantly) positive, i.e., greater than EPS, so we set it to 0 if it is.
 * The first timestep is always 0.
 */
function computeRetirementData(capacity: Entries, capacityPrevious: Entries): Entries {
	// Create a map for quick lookup of previous capacity entries based on the combination of technology, capacity_type, and location.
	const columns = ['technology', 'capacity_type', 'location'];
	const prevMap: Record<string, number[]> = capacityPrevious.reduce(
		(acc, entry) => {
			acc[hash(columns, entry.index)] = entry.data;
			return acc;
		},
		{} as Record<string, number[]>
	);

	// For each entry in capacity, find the corresponding entry in capacity_previous and compute the difference.
	// Assuming that all entries in capacity_previous are in capacity too.
	return capacity.mapEntries((index, data) => {
		const prevEntry = prevMap[hash(columns, index)];
		const newData = data.map((_, i) =>
			i === 0 ? 0 : Math.min((prevEntry?.[i] ?? 0) - data[i - 1], 0)
		);
		return { index, data: newData };
	});
}

/**
 * Generate the datasets for the capacity variable based on the current selection and the provided data.
 */
function generateCapacityDatasets(
	data: Data,
	locations: string[],
	technologies: string[],
	years: number[],
	selection: Selection,
	patterns: ColorBoxItem[]
): ChartDataset<'bar'>[] {
	return forEachValidSolution(
		data,
		selection,
		patterns,
		['capacity'],
		(solutionName, pattern, idx) => {
			const entries = filterAndGroupData(
				data.capacity[idx],
				selection,
				locations,
				technologies,
				years
			);
			return entriesToDatasets(entries, selection, solutionName, pattern);
		}
	);
}

/**
 * Generate the datasets for the capacity addition and retirement based on the current selection and the provided data.
 */
function generateCapacityAdditionAndRetirementDatasets(
	data: Data,
	locations: string[],
	technologies: string[],
	years: number[],
	selection: Selection,
	patterns: ColorBoxItem[]
): ChartDataset<'bar'>[] {
	return forEachValidSolution(
		data,
		selection,
		patterns,
		['capacity', 'capacity_addition', 'capacity_previous'],
		(solutionName, pattern, idx) => {
			// Filter and group the data based on the selection
			const capacity = filterAndGroupData(
				data.capacity[idx],
				selection,
				locations,
				technologies,
				years
			);
			const capacityPrevious = filterAndGroupData(
				data.capacity_previous[idx],
				selection,
				locations,
				technologies,
				years
			);
			const capacityAddition = filterAndGroupData(
				data.capacity_addition[idx],
				selection,
				locations,
				technologies,
				years
			);

			// Compute the retirement data
			const dataAddition = capacityAddition;
			const dataRetirement = computeRetirementData(capacity, capacityPrevious);
			const dataCombined = Entries.concatenate([dataAddition, dataRetirement]);

			// Normalize and convert to datasets
			return entriesToDatasets(dataCombined, selection, solutionName, pattern, '');
		}
	);
}

/**
 * Compute the datasets for the given selection and data.
 *
 * @param data - the data object containing all entries for capacity, capacity_addition, and capacity_previous for each solution.
 * @param locations - the list of all available locations, which will be used for filtering and grouping based on the aggregation option.
 * @param technologies - the list of all available technologies, which will be used for filtering and grouping based on the aggregation option.
 * @param years - the list of all available years, which will be used for filtering the data by the selected years.
 * @param selection - the current selection containing the activated solutions and other parameters that will affect how the datasets are generated.
 * @returns a tuple containing an array of ChartDataset objects for the bar chart and an array of ColorBoxItem objects for the color box legend, where each dataset corresponds to a combination of technology and location (or just technology or location, depending on the aggregation option) and is colored according to the solution and pattern.
 */
export function computeDatasets(
	data: Data,
	locations: string[],
	technologies: string[],
	years: number[],
	selection: Selection
): [ChartDataset<'bar'>[], ColorBoxItem[]] {
	if (
		selection.technologyType == null ||
		selection.locations.length == 0 ||
		selection.years.length == 0 ||
		selection.technologies.length == 0 ||
		data.capacity.length === 0
	) {
		return [[], []];
	}

	resetColorState();
	resetPatternState();
	const patterns: ColorBoxItem[] = [];
	const datasets =
		selection.variable === 'capacity'
			? generateCapacityDatasets(data, locations, technologies, years, selection, patterns)
			: generateCapacityAdditionAndRetirementDatasets(
					data,
					locations,
					technologies,
					years,
					selection,
					patterns
				);

	return [datasets, patterns];
}
