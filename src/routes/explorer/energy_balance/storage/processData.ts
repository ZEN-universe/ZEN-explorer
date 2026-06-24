import type { ChartDataset } from 'chart.js';

import Entries from '$lib/entries';
import { nextColor } from '$lib/colors';
import type { ActivatedSolution } from '$lib/types';

export const WINDOW_SIZES = ['Hourly', 'Daily', 'Weekly', 'Monthly'] as const;
export type WindowSize = (typeof WINDOW_SIZES)[number];

export type DataComponents =
	| 'storage_level'
	| 'flow_storage_charge'
	| 'flow_storage_discharge'
	| 'flow_storage_spillage'
	| 'flow_storage_inflow';

export type Data = Record<DataComponents, Entries>;

export interface Selection {
	solution: ActivatedSolution | null;
	carrier: string | null;
	year: string | null;
	windowSize: WindowSize;
	subdivision: boolean;
	technologies: string[];
	nodes: string[];
}

export function computeDatasets(
	data: Data | null,
	selection: Selection
): [ChartDataset[], ChartDataset[]] {
	if (
		selection.solution === null ||
		!selection.nodes.length ||
		!selection.technologies.length ||
		!data
	) {
		return [[], []];
	}

	const levelComponent = {
		data: data.storage_level,
		labelSuffix: '',
		labelAggregated: 'Storage Level',
		negate: false,
		aggregatedColor: 'rgb(0, 0, 0)',
		aggregatedBackgroundColor: 'rgba(0, 0, 0, 0.2)'
	};

	const flowComponents = [
		{
			data: data.flow_storage_charge,
			labelSuffix: '_charge',
			labelAggregated: 'Flow Storage Charge',
			negate: false,
			aggregatedColor: 'rgb(54, 162, 235)',
			aggregatedBackgroundColor: undefined
		},
		{
			data: data.flow_storage_discharge,
			labelSuffix: '_discharge',
			labelAggregated: 'Flow Storage Discharge',
			negate: true,
			aggregatedColor: 'rgb(255, 99, 132)',
			aggregatedBackgroundColor: undefined
		},
		{
			data: data.flow_storage_inflow,
			labelSuffix: '_inflow',
			labelAggregated: 'Flow Storage Inflow',
			negate: false,
			aggregatedColor: 'rgb(75, 192, 192)',
			aggregatedBackgroundColor: undefined
		},
		{
			data: data.flow_storage_spillage,
			labelSuffix: '_spillage',
			labelAggregated: 'Flow Storage Spillage',
			negate: true,
			aggregatedColor: 'rgb(255, 99, 132)',
			aggregatedBackgroundColor: undefined
		}
	];

	return [
		convertToDatasets(selection, levelComponent),
		flowComponents.flatMap((component) => convertToDatasets(selection, component))
	];
}

function convertToDatasets(
	selection: Selection,
	{
		data,
		labelSuffix,
		labelAggregated,
		negate,
		aggregatedColor,
		aggregatedBackgroundColor
	}: {
		data: Entries;
		labelSuffix: string;
		labelAggregated: string;
		negate: boolean;
		aggregatedColor: string;
		aggregatedBackgroundColor?: string;
	}
) {
	let entries = data
		.filterByCriteria({
			technology: selection.technologies,
			node: selection.nodes
		})
		.groupBy(selection.subdivision ? ['technology'] : []);

	if (negate) {
		entries = entries.mapData((value) => -value);
	}

	return entries.toArray().map((entry) => {
		const color = selection.subdivision ? nextColor() : aggregatedColor;

		return {
			data: entry.data.map((value, i) => ({ x: i, y: value })),
			label: selection.subdivision ? entry.index.technology + labelSuffix : labelAggregated,
			type: 'line',
			fill: 'origin',
			stepped: true,
			borderColor: color,
			backgroundColor:
				selection.subdivision || !aggregatedBackgroundColor ? color : aggregatedBackgroundColor
		} as ChartDataset<'bar' | 'line'>;
	});
}
