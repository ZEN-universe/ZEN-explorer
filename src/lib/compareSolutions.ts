import type { Chart, ChartEvent, ChartType, LegendElement, LegendItem } from 'chart.js';

export function generateLabelsForSolutionComparison(chart: Chart): LegendItem[] {
	const labels: LegendItem[] = [];
	const labelNames = new Set<string>();
	chart.data.datasets.forEach((dataset, index) => {
		if (!labelNames.has(dataset.label || '')) {
			labelNames.add(dataset.label || '');
			labels.push({
				text: dataset.label || '',
				fontColor: chart.options.color as string,
				fillStyle: (dataset.backgroundColor as string) || 'black',
				strokeStyle: (dataset.borderColor as string) || 'black',
				lineWidth: (dataset.borderWidth as number) || 0,
				hidden: !chart.isDatasetVisible(index),
				datasetIndex: index
			} as LegendItem);
		}
	});
	return labels;
}

export function onClickLegendForSolutionComparison(legendItem: LegendItem, chart: Chart): void {
	chart.data.datasets.forEach((dataset, i) => {
		if (dataset.label !== legendItem.text) return;
		chart.setDatasetVisibility(i, !chart.isDatasetVisible(i));
		chart.update();
		// if (chart.isDatasetVisible(i)) {
		// 	chart.hide(i);
		// } else {
		// 	chart.show(i);
		// }
	});
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
