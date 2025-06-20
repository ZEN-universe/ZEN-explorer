export interface Solution {
	id: string;
	name: string;
	folder_name: string;
	nodes: string[];
	technologies: string[];
}

export interface Component {
	component_name: string;
	yearly: boolean;
	aggregated_time_steps_per_year: number;
	levels: string[];
}

export interface System {
	aggregated_time_steps_per_year: number;
	clean_sub_scenarios: boolean;
	conduct_scenario_analysis: boolean;
	conduct_time_series_aggregation: boolean;
	double_capex_transport: boolean;
	enforce_selfish_behavior: boolean;
	exclude_parameters_from_TSA: boolean;
	fix_keys: string[];
	interval_between_years: number;
	knowledge_depreciation_rate: number;
	optimized_years: number;
	reference_year: number;
	run_default_scenario: number;
	set_bidirectional_transport_technologies: string[];
	set_capacity_types: string[];
	set_carriers: string[];
	set_conditioning_carriers: string[];
	set_conditioning_technologies: string[];
	set_conversion_technologies: string[];
	set_nodes: string[];
	set_retrofitting_technologies: string[];
	set_storage_technologies: string[];
	set_technologies: string[];
	set_transport_technologies: string[];
	storage_periodicity: boolean;
	total_hours_per_year: number;
	unaggregated_time_steps_per_year: number;
	use_rolling_horizon: boolean;
	years_in_rolling_horizon: number;
	coords: { [node: string]: { lon: number; lat: number } };
}

export interface ReferenceCarrier {
	[key: string]: string;
}

export interface ScenarioDetail {
	system: System;
	reference_carrier: ReferenceCarrier;
	carriers_input: { [key: string]: string[] };
	carriers_output: { [key: string]: string[] };
	edges: { [key: string]: string };
}

export interface Scenarios {
	[key: string]: ScenarioDetail;
}

export interface SolutionDetail {
	folder_name: string;
	name: string;
	scenarios: Scenarios;
	version: string;
}

export interface ActivatedSolution {
	solution_name: string;
	scenario_name: string;
	detail: ScenarioDetail;
	version: string;
}

export interface Row {
	[key: string]: any;
}

export interface DatasetSelectors {
	[key: string]: string[];
}

export interface EnergyBalanceDataframes {
	demand: Papa.ParseResult<Row> | undefined;
	flow_conversion_input: Papa.ParseResult<Row> | undefined;
	flow_export: Papa.ParseResult<Row> | undefined;
	flow_import: Papa.ParseResult<Row> | undefined;
	flow_storage_charge: Papa.ParseResult<Row> | undefined;
	flow_storage_discharge: Papa.ParseResult<Row> | undefined;
	flow_transport_in: Papa.ParseResult<Row> | undefined;
	flow_transport_out: Papa.ParseResult<Row> | undefined;
	flow_conversion_output: Papa.ParseResult<Row> | undefined;
	shed_demand: Papa.ParseResult<Row> | undefined;
}

export interface Dataset {
	label: string;
	data: YearValue;
	type: string;
}

export interface YearValue {
	[key: string]: number;
}

export interface ComponentTotal {
	unit: Papa.ParseResult<Row> | null;
	data: Papa.ParseResult<Row> | null;
}

export interface DatasetContainer {
	[key: string]: YearValue;
}
