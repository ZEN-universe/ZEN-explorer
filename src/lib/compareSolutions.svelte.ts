import type { ColorBoxItem } from '$components/ColorBox.svelte';
import type { Chart, LegendItem } from 'chart.js';
import { SvelteSet } from 'svelte/reactivity';

// eslint-disable-next-line svelte/prefer-svelte-reactivity
const hiddenDatasets: Set<string> = new Set();
const hiddenPatterns: Set<string> = new SvelteSet();

/**
 * Generates legend labels for solution comparison charts.
 * @param chart The chart instance.
 * @returns An array of LegendItem objects representing the legend labels.
 */
export function generateLabelsForSolutionComparison(chart: Chart): LegendItem[] {
	const labels: LegendItem[] = [];
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const labelNames = new Set<string>();
	chart.data.datasets.forEach((dataset, index) => {
		if (labelNames.has(dataset.label || '')) return;
		labelNames.add(dataset.label || '');
		labels.push({
			text: dataset.label || '',
			fontColor: chart.options.color as string,
			fillStyle: (dataset.backgroundColor as string) || 'black',
			strokeStyle: (dataset.borderColor as string) || 'black',
			lineWidth: (dataset.borderWidth as number) || 0,
			hidden: hiddenDatasets.has(dataset.label || ''),
			datasetIndex: index
		} as LegendItem);
	});
	return labels;
}

/**
 * Handles the click event on a legend item for solution comparison charts.
 * @param legendItem The legend item that was clicked.
 * @param chart The chart instance.
 */
export function onClickLegendForSolutionComparison(legendItem: LegendItem, chart: Chart): void {
	if (hiddenDatasets.has(legendItem.text)) {
		hiddenDatasets.delete(legendItem.text);
	} else {
		hiddenDatasets.add(legendItem.text);
	}
	updateDatasetsVisibility(chart);
}

/**
 * Handles the click event on a pattern item for solution comparison charts.
 * @param pattern The pattern item that was clicked.
 * @param chart The chart instance.
 */
export function onClickPattern(pattern: ColorBoxItem, chart: Chart): void {
	// chart.data.datasets.forEach((dataset, i) => {
	// 	if (dataset.stack !== pattern.text) return;
	// 	chart.setDatasetVisibility(i, !chart.isDatasetVisible(i));
	// });
	if (hiddenPatterns.has(pattern.text)) {
		hiddenPatterns.delete(pattern.text);
	} else {
		hiddenPatterns.add(pattern.text);
	}
	updateDatasetsVisibility(chart);
}

/**
 * Update the visibility of datasets in the chart based on hiddenDatasets and hiddenPatterns.
 * @param chart The chart instance.
 */
function updateDatasetsVisibility(chart: Chart): void {
	chart.data.datasets.forEach((dataset, i) => {
		console.log(
			'dataset',
			dataset.label,
			dataset.stack,
			'set visibility to',
			!(hiddenDatasets.has(dataset.label || '') || hiddenPatterns.has(dataset.stack || ''))
		);

		chart.setDatasetVisibility(
			i,
			!(hiddenDatasets.has(dataset.label || '') || hiddenPatterns.has(dataset.stack || ''))
		);
	});
	chart.update();
}

/**
 * Generates a suffix for a solution based on its name and scenario.
 * If the scenario is 'none', only the solution name is used.
 * @param solutionName The name of the solution.
 * @param scenarioName The name of the scenario.
 * @returns A formatted string that can be used as a suffix for the solution.
 */
export function generateSolutionSuffix(solutionName: string, scenarioName: string): string {
	let suffix = solutionName.split('.').pop() || solutionName;
	if (scenarioName != 'none') {
		suffix = `${suffix} (${scenarioName})`;
	}
	return suffix;
}

export function getHiddenPatterns(): Set<string> {
	return hiddenPatterns;
}
