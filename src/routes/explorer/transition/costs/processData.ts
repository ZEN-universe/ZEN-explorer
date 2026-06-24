import { draw as drawPattern } from 'patternomaly';
import type { ColorBoxItem } from '$components/ColorBox.svelte';
import { addTransparency, nextColor, resetColorState } from '$lib/colors';
import Entries from '$lib/entries';
import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
import type { ActivatedSolution } from '$lib/types';
import type { ChartDataset } from 'chart.js';
import { getVariableName } from '$lib/variables';
import { typedEntries } from '$lib/utils';
import { generateSolutionSuffix } from '$lib/compareSolutions.svelte';

export interface Variable {
	title: string;
	showSubdivision: boolean;
	label?: string;
	helpText: string;
}

export type VariableId = 'capex' | 'opex' | 'carrier' | 'shed_demand' | 'carbon_emission';

export interface Selection {
	solutions: (ActivatedSolution | null)[];
	showVariable: Record<VariableId, boolean>;
	withSubdivision: Partial<Record<VariableId, boolean>>;
	transportTechnologies: string[];
	conversionTechnologies: string[];
	storageTechnologies: string[];
	costCarriers: string[];
	demandCarriers: string[];
	aggregation: string;
	locations: string[];
	years: string[];
}

export type CostComponents = 'capex' | 'opex' | 'carbon' | 'carrier' | 'shedDemand';
export type Data = Record<CostComponents, Entries>;

export const LABELS = {
	technologyCarrier: 'Technology / Carrier',
	capexSuffix: ' (Capex)',
	opexSuffix: ' (Opex)',
	capex: 'Capex',
	opex: 'Opex',
	carrier: 'Carrier',
	shedDemand: 'Shed Demand'
};

export const VARIABLES: Record<VariableId, Variable> = {
	capex: {
		title: 'Capex',
		showSubdivision: true,
		label: LABELS.capex,
		helpText: 'Annualized investment cost to expand technology capacity.'
	},
	opex: {
		title: 'Opex',
		showSubdivision: true,
		label: LABELS.opex,
		helpText: 'Annual (fixed and variable) operational cost of technologies.'
	},
	carrier: {
		title: 'Carrier',
		showSubdivision: true,
		label: LABELS.carrier,
		helpText: 'Annual cost of importing and exporting carriers.'
	},
	shed_demand: {
		title: 'Shed Demand',
		showSubdivision: true,
		label: LABELS.shedDemand,
		helpText: 'Annual cost of shed demand of carriers.'
	},
	carbon_emission: {
		title: 'Carbon Emissions',
		showSubdivision: false,
		helpText: 'Annual cost associated with carbon dioxide emissions.'
	}
};

const variableLabels = Object.values(VARIABLES)
	.filter((variable) => variable.label)
	.map((variable) => variable.label!);

export function getCostComponentsMap(version: string): Record<CostComponents, string> {
	return {
		capex: getVariableName('cost_capex_yearly', version),
		opex: getVariableName('cost_opex_yearly', version),
		carbon: getVariableName('cost_carbon_emissions_total', version),
		carrier: getVariableName('cost_carrier', version),
		shedDemand: getVariableName('cost_shed_demand', version)
	};
}

export function generateDatasetsAndPatterns(
	data: Data[],
	selection: Selection,
	allSelectedTechnologies: string[],
	years: number[]
): [ChartDataset<'bar' | 'line'>[], ColorBoxItem[]] {
	if (allSelectedTechnologies.length == 0) {
		return [[], []];
	}

	resetColorState();
	resetPatternState();
	const patterns: ColorBoxItem[] = [];
	const datasets = selection.solutions.flatMap((solution, solutionIndex) => {
		if (solution === null) {
			return [];
		}

		const variableToDataMap = {
			capex: data[solutionIndex].capex.mapIndex((index) => ({
				location: index['location'],
				[LABELS.technologyCarrier]: index['technology'] + LABELS.capexSuffix
			})),
			opex: data[solutionIndex].opex.mapIndex((index) => ({
				location: index['location'],
				[LABELS.technologyCarrier]: index['technology'] + LABELS.opexSuffix
			})),
			carrier: data[solutionIndex].carrier
				.filter((i) => selection.costCarriers.includes(i.index['carrier']))
				.mapIndex((index) => ({
					location: index['node'],
					[LABELS.technologyCarrier]: index['carrier']
				})),
			shed_demand: data[solutionIndex].shedDemand
				.filter((i) => selection.demandCarriers.includes(i.index['carrier']))
				.mapIndex((index) => ({
					location: index['node'],
					[LABELS.technologyCarrier]: index['carrier']
				}))
		};

		let entries = Entries.concatenate(
			typedEntries(variableToDataMap).map(([variableName, baseEntries]) => {
				if (!selection.showVariable[variableName]) {
					return null;
				}

				const entries = baseEntries
					.filterByCriteria({
						location: selection.locations,
						[LABELS.technologyCarrier]: allSelectedTechnologies.concat(variableLabels)
					})
					.filterDataByIndex(selection.years.map((year) => years.indexOf(Number(year))));

				if (selection.withSubdivision[variableName]) {
					return entries;
				}

				return entries.groupBy(['location']).mapIndex((index) => ({
					location: index['location'],
					[LABELS.technologyCarrier]: VARIABLES[variableName].label || ''
				}));
			})
		);

		if (selection.aggregation == LABELS.technologyCarrier) {
			entries = entries.groupBy(['location']);
		} else {
			entries = entries.groupBy([LABELS.technologyCarrier]);
		}

		// Get plot data, as a base we take the grouped data adapted to the cost selection.
		const pattern = solutionIndex > 0 ? nextPattern() : undefined;
		const suffix = generateSolutionSuffix(solution);
		patterns.push(createColorBoxItem(suffix, pattern));
		const datasets: ChartDataset<'bar'>[] = entries.toArray().map((entry) => {
			const label =
				selection.aggregation == LABELS.technologyCarrier
					? entry.index.location
					: entry.index[LABELS.technologyCarrier];
			const color = nextColor(label);
			return {
				label,
				data: entry.data,
				backgroundColor:
					pattern !== undefined
						? drawPattern(pattern, addTransparency(color))
						: addTransparency(color),
				stack: suffix
			};
		});

		// Get total carbon cost data
		if (data[solutionIndex].carbon.length === 1 && selection.showVariable.carbon_emission) {
			const carbonCostEntries = data[solutionIndex].carbon.filterDataByIndex(
				selection.years.map((year) => years.indexOf(Number(year)))
			);
			const color = nextColor('Total Carbon Costs');
			datasets.push({
				data: carbonCostEntries.get(0)!.data,
				label: 'Total Carbon Costs',
				backgroundColor:
					pattern !== undefined
						? drawPattern(pattern, addTransparency(color))
						: addTransparency(color),
				stack: suffix
			});
		}

		return datasets as ChartDataset<'bar' | 'line'>[];
	});

	return [datasets, patterns];
}
