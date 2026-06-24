import { env } from '$env/dynamic/public';
import Entries from './entries';
import { typedEntries } from './utils';
import { parseCSV, parseTimeseriesData, parseUnitData } from './parser';

import type {
	Solution,
	ComponentTotal,
	SolutionDetail,
	NodalComponent,
	NodalData,
	TimeSeriesResponseEntry,
	ComponentTimeSeries
} from '$lib/types';

/**
 * Helper function to fetch the solutions/list endpoint of the temple
 * @returns Promise with a list of solutions as returned by the API Server.
 */
export async function fetchSolutions(): Promise<Solution[]> {
	const url = env.PUBLIC_TEMPLE_URL + 'solutions/list';

	const solution_list_request = await fetch(url, { cache: 'no-store' });

	if (!solution_list_request.ok) {
		alert('could not fetch ' + url);
		return [];
	}
	const solution_list: Array<Solution> = await solution_list_request.json();

	solution_list.sort((a, b) => {
		return a.name.localeCompare(b.name);
	});
	return solution_list;
}

/**
 * Helper function to fetch the solution-detail endpoint of the temple.
 * @param solution Name of the solution
 * @returns Promise with the SolutionDetail API Server.
 */
export async function fetchSolutionDetail(solution: string): Promise<SolutionDetail> {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/detail');
	urlObj.searchParams.set('solution_name', solution);
	const url = urlObj.toString();

	const solution_detail_request = await fetch(url, { cache: 'no-store' });

	if (!solution_detail_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}
	const solution_detail = await solution_detail_request.json();

	return solution_detail;
}

/**
 * Helper function to fetch the unit endpoint of the temple.
 * @param solution_name Name of the solution
 * @param component_name Name of the component
 * @param scenario_name Name of the scenario
 * @returns Papaparsed CSV of the Unit-Dataframe from the API Server
 */
export async function fetchUnit(solution_name: string, component_name: string) {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/unit');
	urlObj.searchParams.set('solution_name', solution_name);
	urlObj.searchParams.set('component', component_name);
	const url = urlObj.toString();

	const unit_data = await (await fetch(url, { cache: 'no-store' })).json();

	return parseUnitData(unit_data);
}

/**
 * Helper function to fetch the total of a component from the Temple. It removes rows that only contain zeros.
 * @param solution_name Name of the solution
 * @param components Name of the component
 * @param scenario_name Name of the scenario
 * @param start_year Start year
 * @param step_year Number of steps between years
 * @param year_index Year to fetch
 * @returns Promise of the ComponentTotal as returned by the temple.
 */
export async function fetchTotal<T extends string>(
	solution_name: string,
	components: T[],
	scenario_name: string,
	carrier: string = '',
	unit_component: string = ''
): Promise<ComponentTotal<T>> {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/total');
	urlObj.searchParams.set('solution_name', solution_name);
	urlObj.searchParams.set('components', components.join(','));
	urlObj.searchParams.set('scenario', scenario_name);
	if (carrier !== '') urlObj.searchParams.set('carrier', carrier);
	urlObj.searchParams.set('unit_component', unit_component);
	const url = urlObj.toString();

	const component_data_request = await fetch(url, { cache: 'no-store' });

	if (!component_data_request.ok) {
		alert('Error when fetching ' + url);
		throw new Error('Error when fetching ' + url);
	}

	const component_data = await component_data_request.json();

	for (const key in component_data) {
		if (key == 'unit' || component_data[key] === undefined) {
			continue;
		}

		component_data[key] = parseCSV(component_data[key]);
	}
	component_data.unit = parseUnitData(component_data.unit || '');

	return component_data;
}

/**
 * Helper function to fetch the full timeseries of a component from the Temple.
 * @param solution_name Name of the solution
 * @param components Names of the components
 * @param scenario_name Name of the scenario
 * @param year Year
 * @returns Promise of the TimeSeries as returned by the API
 */
export async function fetchFullTs<T extends string>(
	solution_name: string,
	components: T[],
	scenario_name: string,
	unit_component: string = '',
	year_index: number = 0,
	window_size: number = 1,
	carrier: string = ''
): Promise<ComponentTimeSeries<T>> {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/full_ts');
	urlObj.searchParams.set('solution_name', solution_name);
	urlObj.searchParams.set('components', components.join(','));
	urlObj.searchParams.set('unit_component', unit_component);
	urlObj.searchParams.set('scenario_name', scenario_name);
	urlObj.searchParams.set('year', year_index.toString());
	urlObj.searchParams.set('rolling_average_window_size', window_size.toString());
	if (carrier !== '') {
		urlObj.searchParams.set('carrier', carrier);
	}
	const url = urlObj.toString();

	const componentDataRequest = await fetch(url, { cache: 'no-store' });

	if (!componentDataRequest.ok) {
		alert('Error when fetching ' + url);
		throw new Error('Error when fetching ' + url);
	}

	const { unit = '', ...componentsData } = await componentDataRequest.json();

	const parsedComponents = Object.fromEntries(
		Object.entries(componentsData as Record<string, TimeSeriesResponseEntry[] | null>).map(
			([key, values]) => [key, values !== null ? parseTimeseriesData(values) : Entries.empty]
		)
	) as Record<T, Entries>;

	return {
		unit: parseUnitData(unit as string),
		components: parsedComponents
	};
}

/**
 * Helper function to fetch energy-balance dataframes of the temple.
 * @param solution Name of the solution
 * @param node Name of the node
 * @param carrier Name of the carrier
 * @param scenario Name of the scenario
 * @param year Desired year
 * @returns Promise of an Object that contains the Energy Balance Dataframes
 */
export async function fetchEnergyBalance(
	solution: string,
	node: string,
	carrier: string,
	scenario: string,
	year: number,
	window_size: number
): Promise<NodalData> {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + `solutions/energy_balance`);
	urlObj.searchParams.set('solution_name', solution);
	urlObj.searchParams.set('node', node);
	urlObj.searchParams.set('carrier', carrier);
	urlObj.searchParams.set('scenario_name', scenario);
	urlObj.searchParams.set('year', year.toString());
	urlObj.searchParams.set('rolling_average_window_size', window_size.toString());
	const url = urlObj.toString();

	const response = await fetch(url, { cache: 'no-store' });

	if (!response.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}

	const data = (await response.json()) as Record<NodalComponent, TimeSeriesResponseEntry[] | null>;

	const COMPONENTS: NodalComponent[] = [
		'shed_demand',
		'demand',
		'flow_conversion_input',
		'flow_export',
		'flow_import',
		'flow_storage_charge',
		'flow_storage_discharge',
		'flow_transport_in',
		'flow_transport_out',
		'flow_conversion_output',
		'constraint_nodal_energy_balance'
	];

	const res: Partial<NodalData> = {};
	for (const component of COMPONENTS) {
		res[component] = data[component] ? parseTimeseriesData(data[component]) : Entries.empty;
	}

	return res as NodalData;
}
