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
 * @param activateOnlyOneItem Whether to activate only one item.
 */
export function onClickLegendForSolutionComparison(
	legendItem: LegendItem,
	chart: Chart,
	activateOnlyOneItem: boolean
): void {
	if (activateOnlyOneItem) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const activeItems = new Set<string>();
		chart.data.datasets
			.filter((dataset) => !hiddenDatasets.has(dataset.label || ''))
			.forEach((dataset) => activeItems.add(dataset.label || ''));
		const itemWasActive = !hiddenDatasets.has(legendItem.text);

		if (activeItems.size === 1 && itemWasActive) {
			// If the clicked item was the only active one, unhide all items
			hiddenDatasets.clear();
		} else {
			// Otherwise, hide all items ...
			chart.data.datasets.forEach((dataset) => hiddenDatasets.add(dataset.label || ''));
			// ... except the clicked one
			hiddenDatasets.delete(legendItem.text);
		}
	} else {
		if (hiddenDatasets.has(legendItem.text)) {
			hiddenDatasets.delete(legendItem.text);
		} else {
			hiddenDatasets.add(legendItem.text);
		}
	}
	updateDatasetsVisibility(chart);
}

export function resetLegendStateForSolutionComparison(chart: Chart): void {
	// Filter hidden datasets to only include those that are still present in the chart
	for (const datasetLabel of hiddenDatasets) {
		if (!chart.data.datasets.some((dataset) => dataset.label === datasetLabel)) {
			hiddenDatasets.delete(datasetLabel);
		}
	}

	// Filter hidden patterns to only include those that are still present in the chart
	for (const patternLabel of hiddenPatterns) {
		if (!chart.data.datasets.some((dataset) => dataset.stack === patternLabel)) {
			hiddenPatterns.delete(patternLabel);
		}
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
