import type { ChartDataset, ChartOptions } from 'chart.js';

export interface PieDataset {
	data: number | null;
	color: string | string[] | undefined;
	label: string | undefined;
}

export function getDataForActiveYear(
	datasets: ChartDataset<'bar'>[],
	year: string | null,
	solution: string | null,
	labels: string[]
): PieDataset[] {
	if (year === null) return [];

	const idx = labels.findIndex((label) => label === year);
	return datasets
		.filter((d) => d.stack === solution)
		.map((d) => {
			return {
				data: d.data.find((_, i) => i === idx) as number | null,
				color: d.backgroundColor as string | string[] | undefined,
				label: d.label
			};
		});
}

export function hasMultipleSolutions(datasets: ChartDataset<'bar'>[]): boolean {
	return new Set(datasets.map((d) => d.stack)).size > 1;
}

export function getPlotOptions(tooltipSuffix: string): ChartOptions<'pie'> {
	const plugins: ChartOptions<'pie'>['plugins'] = {
		tooltip: {
			callbacks: {
				label: (item) => {
					const value = Number(item.raw || 0);
					const total = item.dataset.data
						.map((val) => Number(val || 0))
						.reduce((acc, val) => acc + val, 0);
					const percentage = ((value * 100) / total).toFixed(2);
					return `${item.dataset.label}: ${item.formattedValue}${tooltipSuffix} (${percentage}%)`;
				}
			}
		},
		legend: {
			position: 'top' as const
		}
	};

	return {
		animation: {
			duration: 0
		},
		maintainAspectRatio: true,
		radius: '90%',
		plugins: plugins
	};
}
