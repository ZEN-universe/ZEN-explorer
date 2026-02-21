import Entries from './entries';
import { fetchTotal } from './temple';
import type { ActivatedSolution } from './types';
import { getTransportEdges } from './utils';

export const components = [
	'flow_conversion_output',
	'flow_conversion_input',
	'flow_storage_discharge',
	'flow_storage_charge',
	'flow_import',
	'flow_export',
	'flow_transport',
	'flow_transport_loss',
	'shed_demand',
	'demand'
] as const;

export type Component = (typeof components)[number];

export interface Variable {
	shortId: string;
	title: string;
	showSubdivision: boolean;
	filterByTechnologies: boolean;
	positive: Component;
	positiveLabel: string;
	positiveSuffix?: string;
	negative: Component;
	negativeLabel: string;
	negativeSuffix?: string;
}

export type VariableId =
	| 'conversion'
	| 'storage'
	| 'transport'
	| 'importExport'
	| 'demandShedDemand';

export const variables: Record<VariableId, Variable> = {
	conversion: {
		shortId: 'conv',
		title: 'Conversion',
		showSubdivision: true,
		filterByTechnologies: true,
		positive: 'flow_conversion_output',
		positiveLabel: 'Conversion output',
		negative: 'flow_conversion_input',
		negativeLabel: 'Conversion input'
	},
	storage: {
		shortId: 'stor',
		title: 'Storage',
		showSubdivision: true,
		filterByTechnologies: true,
		positive: 'flow_storage_discharge',
		positiveLabel: 'Storage discharge',
		positiveSuffix: ' (discharge)',
		negative: 'flow_storage_charge',
		negativeLabel: 'Storage charge',
		negativeSuffix: ' (charge)'
	},
	transport: {
		shortId: 'tran',
		title: 'Transport',
		showSubdivision: true,
		filterByTechnologies: true,
		positive: 'flow_transport',
		positiveLabel: 'Transport in',
		positiveSuffix: ' (transport in)',
		negative: 'flow_transport_loss',
		negativeLabel: 'Transport out',
		negativeSuffix: ' (transport out)'
	},
	importExport: {
		shortId: 'imp_exp',
		title: 'Import/Export',
		showSubdivision: false,
		filterByTechnologies: false,
		positive: 'flow_import',
		positiveLabel: 'Import',
		negative: 'flow_export',
		negativeLabel: 'Export'
	},
	demandShedDemand: {
		shortId: 'dem_shed',
		title: 'Demand/Shed Demand',
		showSubdivision: false,
		filterByTechnologies: false,
		positive: 'shed_demand',
		positiveLabel: 'Shed Demand',
		negative: 'demand',
		negativeLabel: 'Demand'
	}
};

export async function fetchProductionData(
	solution: ActivatedSolution,
	carrier: string
): Promise<Record<Component, Entries>> {
	const response = await fetchTotal(
		solution.solution_name,
		[...components],
		solution.scenario_name,
		carrier,
		'demand'
	);

	return Object.values(variables).reduce((acc, variable) => {
		acc[variable.positive] = Entries.fromRows(response[variable.positive]?.data || []);
		acc[variable.negative] = Entries.fromRows(response[variable.negative]?.data || []);
		return acc;
	}, {} as Record<Component, Entries>);
}

export function computeTransportData(
	positiveData: Entries,
	negativeData: Entries,
	edges: Record<string, string>,
	transportTechnologies: string[],
	nodes: string[]
): [Entries, Entries] {
	const outgoingEdges = getTransportEdges(edges, nodes, false);
	const incomingEdges = getTransportEdges(edges, nodes, true);

	// transport_out are all outgoing flows
	negativeData = positiveData.filterByCriteria({
		technology: transportTechnologies,
		edge: outgoingEdges
	});

	// transport_in are all incoming flows, calculated as transport gain - transport loss
	const transportGains = positiveData.filterByCriteria({
		technology: transportTechnologies,
		edge: incomingEdges
	});
	const transportInLoss = negativeData.filterByCriteria({
		technology: transportTechnologies,
		edge: incomingEdges
	});
	positiveData = transportGains.mapEntries((index, data) => {
		// Find loss entry with the same technology and edge
		const lossData = transportInLoss.find(
			(entry) => entry.index.technology === index.technology && entry.index.edge === index.edge
		)?.data;
		// If no corresponding loss data is found, return the original gain data
		if (!lossData || lossData.length !== data.length) return { index, data };
		// Subtract loss data from gain data
		return { data: data.map((n, i) => n - lossData[i]), index };
	});

	return [positiveData, negativeData];
}
