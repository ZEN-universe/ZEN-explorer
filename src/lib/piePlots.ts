import type { ChartDataset, ChartOptions } from 'chart.js';
import { getBrightness } from './colors';

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

export function getPlotOptions(labelSuffix: string): ChartOptions<'pie'> {
	const plugins: ChartOptions<'pie'>['plugins'] = {
		tooltip: {
			callbacks: {
				label: (item) => {
					const value = Number(item.raw || 0);
					const total = item.dataset.data
						.map((val) => Number(val || 0))
						.reduce((acc, val) => acc + val, 0);
					const percentage = ((value * 100) / total).toFixed(2);
					return `${item.dataset.label}: ${item.formattedValue}${labelSuffix} (${percentage}%)`;
				}
			}
		},
		datalabels: {
			formatter: (value, context) => {
				const dataset = context.dataset.data as number[];
				const total = dataset.reduce((acc, val) => acc + (val || 0), 0);
				const percentage = ((Number(value) * 100) / total).toFixed(2);
				return `${percentage}%`;
			},
			display: (context) => {
				const value = Number(context.dataset.data[context.dataIndex] || 0);
				const dataset = context.dataset.data as number[];
				const total = dataset.reduce((acc, val) => acc + (val || 0), 0);
				return value / total > 0.03; // Only display labels for values greater than 3% of the total
			},
			color: (context) => {
				const bgColor = (context.dataset.backgroundColor as string[])[context.dataIndex];
				if (!bgColor.startsWith('rgb')) {
					return '#000'; // Default to black if color is not defined in rgb format
				}
				return getBrightness(bgColor) > 125 ? '#000' : '#fff'; // Use black for light backgrounds and white for dark backgrounds
			},
			align: 'end',
			offset: 35
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
