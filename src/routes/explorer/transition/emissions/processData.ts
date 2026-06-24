import type { ChartDataset } from 'chart.js';
import { draw as drawPattern } from 'patternomaly';

import Entries from '$lib/entries';
import type { ActivatedSolution } from '$lib/types';

import type { ColorBoxItem } from '$components/ColorBox.svelte';
import type { FilterCriteria } from '$lib/entries';
import { addTransparency, nextColor, resetColorState } from '$lib/colors';
import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
import { generateSolutionSuffix } from '$lib/compareSolutions.svelte';

export const components = [
	'carbon_emissions_technology',
	'carbon_emissions_carrier',
	'carbon_emissions_annual_limit',
	'carbon_emissions_budget',
	'carbon_emissions_annual',
	'carbon_emissions_cumulative'
] as const;

export type EmissionComponent = (typeof components)[number];

export type Data = Record<EmissionComponent, Entries>;

export interface Selection {
	solutions: (ActivatedSolution | null)[];
	subdivision: boolean;
	cumulation: string;
	aggregation: 'location' | 'technology_carrier';
	normalization: boolean;
	technologies: string[];
	carriers: string[];
	locations: string[];
	years: string[];
}

export function generateBarDatasetsAndPatterns(
	data: Data[],
	selection: Selection,
	isNormalized: boolean,
	divisionVariable: EmissionComponent,
	years: number[]
): [ChartDataset<'bar'>[], ColorBoxItem[]] {
	if (!selection.solutions.length || !data.length) {
		return [[], []];
	}

	let filterCriteria: FilterCriteria;
	let groupByColumns: string[];
	if (!selection.subdivision) {
		filterCriteria = {};
		groupByColumns = [];
	} else if (selection.aggregation == 'location') {
		filterCriteria = {
			technology_carrier: selection.technologies.concat(selection.carriers),
			location: selection.locations
		};
		groupByColumns = ['technology_carrier'];
	} else {
		filterCriteria = {
			technology_carrier: selection.technologies.concat(selection.carriers),
			location: selection.locations
		};
		groupByColumns = ['location'];
	}

	resetColorState();
	resetPatternState();
	const patterns: ColorBoxItem[] = [];
	const datasets = selection.solutions.flatMap((solution, solutionIndex) => {
		if (!solution) {
			return [];
		}

		let entries: Entries;
		if (selection.subdivision) {
			entries = Entries.concatenate([
				data[solutionIndex].carbon_emissions_carrier.mapIndex((d) => ({
					...d,
					technology_carrier: d.carrier,
					location: d.node
				})),
				data[solutionIndex].carbon_emissions_technology.mapIndex((d) => ({
					...d,
					technology_carrier: d.technology
				}))
			]);
		} else if (selection.cumulation == 'Annual') {
			entries = data[solutionIndex].carbon_emissions_annual;
		} else {
			entries = data[solutionIndex].carbon_emissions_cumulative;
		}

		entries = entries
			.filterByCriteria(filterCriteria)
			.groupBy(groupByColumns)
			.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))));

		if (isNormalized) {
			entries = entries.normalize();
		}

		const suffix = generateSolutionSuffix(solution);
		const pattern = solutionIndex > 0 ? nextPattern() : undefined;
		patterns.push(createColorBoxItem(suffix, pattern));

		return entries.toArray().map((entry) => {
			const label =
				entries.length === 1
					? divisionVariable
					: selection.aggregation === 'location'
						? entry.index.technology_carrier
						: entry.index.location;
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

export function generateLineDatasets(
	data: Data[],
	selection: Selection,
	isNormalized: boolean
): ChartDataset<'line'>[] {
	if (selection.solutions.length === 0 || isNormalized) {
		return [];
	}

	return selection.solutions.flatMap((solution, solutionIndex) => {
		if (!solution) {
			return [];
		}

		let entry: number[];
		if (selection.subdivision || selection.cumulation == 'Annual') {
			if (data[solutionIndex].carbon_emissions_annual_limit.length === 0) {
				return [];
			}
			entry = data[solutionIndex].carbon_emissions_annual_limit.entries[0].data;
		} else {
			if (data[solutionIndex].carbon_emissions_budget.length === 0) {
				return [];
			}
			const value = Number(data[solutionIndex].carbon_emissions_budget.entries[0].data[0]);
			entry = selection.years.map(() => value);
		}

		const suffix = generateSolutionSuffix(solution);
		const label =
			(selection.subdivision || selection.cumulation == 'Annual'
				? 'Annual Emissions Limit'
				: 'Carbon Emissions Budget') + (selection.solutions.length > 1 ? ` (${suffix})` : '');
		const color = nextColor(label);

		return [
			{
				label,
				data: entry,
				borderColor: color,
				backgroundColor: addTransparency(color),
				type: 'line' as const
			}
		];
	});
}
