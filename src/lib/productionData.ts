import Entries from './entries';
import { fetchTotal } from './temple';
import type { ActivatedSolution, UnitData } from './types';

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

export type ProductionComponent = (typeof components)[number];

export interface Variable {
	shortId: string;
	title: string;
	showSubdivision: boolean;
	filterByTechnologies: boolean;
	positive: ProductionComponent;
	positiveLabel: string;
	positiveSuffix?: string;
	negative: ProductionComponent;
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
	carrier: string,
	unitComponent: string
): Promise<Record<ProductionComponent, Entries> & UnitData> {
	const response = await fetchTotal(
		solution.solution_name,
		[...components],
		solution.scenario_name,
		carrier,
		unitComponent
	);

	const ans = Object.values(variables).reduce(
		(acc, variable) => {
			acc[variable.positive] = Entries.fromRows(response[variable.positive]?.data || []);
			acc[variable.negative] = Entries.fromRows(response[variable.negative]?.data || []);
			return acc;
		},
		{} as Record<ProductionComponent, Entries> & UnitData
	);
	ans['unit'] = response.unit;
	return ans;
}
