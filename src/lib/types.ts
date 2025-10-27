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

export type Row = Record<string, any>;

export interface TimeSeriesResponseEntry {
	d: number[];
	t: [number, number];
	[key: string]: string | number[];
}

export type Index = Record<string, string>;

export interface Entry {
	index: Index;
	data: number[];
}

export interface DatasetSelectors {
	[key: string]: string[];
}

export interface EnergyBalanceDataframes {
	demand: Entry[];
	flow_conversion_input: Entry[];
	flow_export: Entry[];
	flow_import: Entry[];
	flow_storage_charge: Entry[];
	flow_storage_discharge: Entry[];
	flow_transport_in: Entry[];
	flow_transport_out: Entry[];
	flow_conversion_output: Entry[];
	shed_demand: Entry[];
	constraint_nodal_energy_balance: Entry[];
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
	[key: string]: Papa.ParseResult<Row> | null;
}

export interface ComponentTimeSeries {
	unit: Papa.ParseResult<Row> | null;
	components: { [key: string]: Entry[] };
}

export interface DatasetContainer {
	[key: string]: YearValue;
}

export interface SankeyNode {
	/** Identifier for the node */
	id: string;
	/** Display label for the node */
	label: string;
	/** Color of the node */
	color: string;
	/** Value of the node that determines its height */
	value: number;
	/** Unit of the node's value */
	unit: string;
	/** Whether to display the unit suffix */
	unitSuffix: boolean;
	/** Whether to stick to left or right */
	stickTo: 'left' | 'right' | null;
	/** Whether to include the total value */
	showTotal: boolean;
	/** Incoming links to the node */
	linksIn: SankeyLink[];
	/** Outgoing links from the node */
	linksOut: SankeyLink[];
	/** Horizontal position of the node */
	x: number;
	/** Vertical position of the node */
	y: number;
	/** Height of the node */
	dy: number;
}

export interface PartialSankeyLink {
	source: Partial<SankeyNode>;
	target: Partial<SankeyNode>;
	value: number;
	color: string;
	unit: string;
}

export interface SankeyLink {
	/** The source node of the link */
	source: SankeyNode;
	/** The target node of the link */
	target: SankeyNode;
	/** The weight of the link */
	value: number;
	/** The color of the link */
	color: string;
	/** The unit of the link's value */
	unit: string;
	/** Whether this link causes a cycle in the graph */
	causesCycle: boolean;
	/** The index of the cycle this link is part of (if any) */
	cycleIndex: number;
	/** The height of the link */
	dy: number;
	/** The vertical offset at the source node */
	sy: number;
	/** The vertical offset at the target node */
	ty: number;
}

export interface RawSankeyNode {
	label: string;
	color: string;
	value: number;
	unit: string;
	unitSuffix: boolean;
	showTotal: boolean;
	x: number;
	y: number;
	dy: number;
	linksIn: number[];
	linksOut: number[];
}

export interface RawSankeyLink {
	source: RawSankeyNode;
	target: RawSankeyNode;
	value: number;
	color: string;
	unit: string;
	causesCycle: boolean;
	cycleIndex: number;
	dy: number;
	sy: number;
	ty: number;
}
