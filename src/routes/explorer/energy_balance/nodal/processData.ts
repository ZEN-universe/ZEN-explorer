import type { ChartDataset } from 'chart.js';

import type { ActivatedSolution, NodalComponent, NodalData } from '$lib/types';
import { typedEntries } from '$lib/utils';
import { nextColor } from '$lib/colors';

export const WINDOW_SIZES = ['Hourly', 'Daily', 'Weekly', 'Monthly'] as const;

export type WindowSize = (typeof WINDOW_SIZES)[number];

export interface Selection {
	solution: ActivatedSolution | null;
	node: string | null;
	carrier: string | null;
	year: string | null;
	windowSize: WindowSize;
	transportByNode: boolean;
}

const DUALS_COMPONENT: NodalComponent = 'constraint_nodal_energy_balance';
const TRANSPORT_IN: NodalComponent = 'flow_transport_in';
const TRANSPORT_OUT: NodalComponent = 'flow_transport_out';

export function computeDatasets(
	data: NodalData | null,
	selection: Selection
): ChartDataset<'bar' | 'line'>[] {
	if (!selection.solution || !selection.node || !selection.carrier || !selection.year || !data) {
		return [];
	}

	const labelMap: Partial<Record<NodalComponent, (label: string) => string>> = {
		flow_storage_charge: (label) => `${label} (charge)`,
		flow_storage_discharge: (label) => `${label} (discharge)`,
		flow_import: () => 'Import',
		flow_export: () => 'Export',
		shed_demand: () => 'Shed Demand',
		flow_transport_in: (label) => `${label}${selection.transportByNode ? '' : ' (transport in)'}`,
		flow_transport_out: (label) => `${label}${selection.transportByNode ? '' : ' (transport out)'}`
	};

	return typedEntries(data).flatMap(([component, entries]) => {
		if (!entries || entries.length === 0 || component === DUALS_COMPONENT) {
			return [];
		}

		if (selection.transportByNode && [TRANSPORT_IN, TRANSPORT_OUT].includes(component)) {
			// For transport flows, filter by selection. node in either 'from_node' or 'to_node'
			entries = entries
				.mapIndex((index) => {
					const [from, to] = index.edge.split('-');
					const suffix = component == TRANSPORT_IN ? `in from ${from}` : `out to ${to}`;
					return {
						label: `${index.technology} (transport ${suffix})`
					};
				})
				.groupBy(['label']);
		} else {
			// For other components group by technology, node, and label
			entries = entries.groupBy(['technology', 'node', 'label']);
		}

		return entries.toArray().map(({ data, index }) => {
			const label = index.technology || index.node || index.label || '';
			const color = nextColor();
			const datasetData = Object.values(data).map((value, i) => ({ x: i, y: value }));

			if (component == 'demand') {
				return {
					data: datasetData,
					label: 'Demand',
					type: 'line',
					stack: 'ownCustomStack',
					fill: false,
					borderColor: 'black',
					backgroundColor: 'white',
					borderWidth: 2,
					stepped: true,
					pointRadius: Object.keys(data).length == 1 ? 2 : 0
				} as ChartDataset<'bar' | 'line'>;
			} else {
				return {
					data: datasetData,
					label: labelMap[component]?.(label) || label,
					fill: 'origin',
					borderColor: color,
					backgroundColor: color,
					stepped: true,
					cubicInterpolationMode: 'monotone',
					pointRadius: Object.keys(data).length == 1 ? 2 : 0
				} as ChartDataset<'bar' | 'line'>;
			}
		});
	});
}

export function computeDualsDatasets(data: NodalData | null, selection: Selection) {
	if (
		!selection.solution ||
		!selection.node ||
		!selection.carrier ||
		!selection.year ||
		!data ||
		!data[DUALS_COMPONENT].length
	) {
		return [];
	}

	return data[DUALS_COMPONENT].toArray()
		.filter((entry) => entry.data.length > 0)
		.map((entry) => {
			return {
				data: entry.data.map((value, i) => ({ x: i, y: value })),
				label: `shadow_price_${entry.index.carrier}_${entry.index.node}`,
				fill: false,
				borderColor: 'rgb(0, 0, 0)',
				backgroundColor: 'rgb(0, 0, 0)',
				borderWidth: 2,
				stepped: true,
				cubicInterpolationMode: 'monotone',
				pointRadius: entry.data.length == 1 ? 2 : 0
			} as ChartDataset<'bar' | 'line'>;
		});
}
