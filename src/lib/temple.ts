import { env } from '$env/dynamic/public';
import Papa from 'papaparse';
import type {
	Solution,
	ComponentTotal,
	SolutionDetail,
	EnergyBalanceDataframes,
	Row,
	TimeSeriesResponseEntry,
	ComponentTimeSeries,
	Entry
} from '$lib/types';

/**
 * Helper function to fetch the solutions/list endpoint of the temple
 * @returns Promise with a list of solutions as returned by the API Server.
 */
export async function get_solutions(): Promise<Solution[]> {
	let url = env.PUBLIC_TEMPLE_URL + 'solutions/list';

	let solution_list_request = await fetch(url, { cache: 'no-store' });

	if (!solution_list_request.ok) {
		alert('could not fetch ' + url);
		return [];
	}
	let solution_list: Array<Solution> = await solution_list_request.json();

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
export async function get_solution_detail(solution: string): Promise<SolutionDetail> {
	const url = env.PUBLIC_TEMPLE_URL + `solutions/get_detail/${solution}`;
	let solution_detail_request = await fetch(url, { cache: 'no-store' });

	if (!solution_detail_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}
	let solution_detail = await solution_detail_request.json();

	return solution_detail;
}

/**
 * Helper function to fetch the full timeseries of a component from the Temple.
 * @param solution_name Name of the solution
 * @param components Name of the compoennt
 * @param scenario_name Name of the scenario
 * @param year Year
 * @returns Promise of the TimeSeries as returned by the API
 */
export async function get_full_ts(
	solution_name: string,
	components: string[],
	scenario_name: string,
	unit_component: string = '',
	year_index: number = 0,
	window_size: number = 1
): Promise<ComponentTimeSeries> {
	const urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/get_full_ts');
	urlObj.searchParams.set('solution_name', solution_name);
	urlObj.searchParams.set('components', components.join(','));
	urlObj.searchParams.set('unit_component', unit_component);
	urlObj.searchParams.set('scenario', scenario_name);
	urlObj.searchParams.set('year', year_index.toString());
	urlObj.searchParams.set('rolling_average_size', window_size.toString());
	const url = urlObj.toString();

	let component_data_request = await fetch(url, { cache: 'no-store' });

	if (!component_data_request.ok) {
		alert('Error when fetching ' + url);
		throw new Error('Error when fetching ' + url);
	}

	let component_data = await component_data_request.json();

	const parsed_components: { [key: string]: Entry[] } = Object.fromEntries(
		Object.entries(component_data)
			.map(([key, values]) => {
				if (key == 'unit' || values === undefined) {
					return null;
				}

				return [key, parse_timeseries_data(values as TimeSeriesResponseEntry[])] as [
					string,
					Entry[]
				];
			})
			.filter((entry) => entry !== null)
	);

	return {
		unit: parse_unit_data(component_data.unit || ''),
		components: parsed_components
	};
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
export async function get_component_total(
	solution_name: string,
	components: string[],
	scenario_name: string,
	unit_component: string = ''
): Promise<ComponentTotal> {
	let urlObj = new URL(env.PUBLIC_TEMPLE_URL + 'solutions/get_total');
	urlObj.searchParams.set('solution_name', solution_name);
	urlObj.searchParams.set('components', components.join(','));
	urlObj.searchParams.set('scenario', scenario_name);
	urlObj.searchParams.set('unit_component', unit_component);
	const url = urlObj.toString();

	let component_data_request = await fetch(url, { cache: 'no-store' });

	if (!component_data_request.ok) {
		alert('Error when fetching ' + url);
		throw new Error('Error when fetching ' + url);
	}

	let component_data = await component_data_request.json();

	for (const key in component_data) {
		if (key == 'unit' || component_data[key] === undefined) {
			continue;
		}

		component_data[key] = filter_zero_rows(parse_csv(component_data[key]));
	}
	component_data.unit = parse_unit_data(component_data.unit || '');

	return component_data;
}

/**
 * Helper function to fetch the unit endpoint of the temple.
 * @param solution_name Name of the solution
 * @param component_name Name of the component
 * @param scenario_name Name of the scenario
 * @returns Papaparsed CSV of the Unit-Dataframe from the API Server
 */
export async function get_unit(
	solution_name: string,
	component_name: string,
	scenario_name: string
) {
	let unit_data = await (
		await fetch(
			env.PUBLIC_TEMPLE_URL +
				`solutions/get_unit/${solution_name}/${component_name}?scenario=${scenario_name}`,
			{ cache: 'no-store' }
		)
	).json();

	return parse_unit_data(unit_data);
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
export async function get_energy_balance(
	solution: string,
	node: string,
	carrier: string,
	scenario: string,
	year: number,
	window_size: number
): Promise<EnergyBalanceDataframes> {
	const url =
		env.PUBLIC_TEMPLE_URL +
		`solutions/get_energy_balance/${solution}/${node}/${carrier}?scenario=${scenario}&year=${year}&rolling_average_size=${window_size}`;

	let energy_balance_data_request = await fetch(url, { cache: 'no-store' });

	if (!energy_balance_data_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}

	let energy_balance_data = await energy_balance_data_request.json();

	let series_names = [
		'shed_demand',
		'demand',
		'flow_conversion_input',
		'flow_export',
		'flow_import',
		'flow_storage_charge',
		'flow_storage_discharge',
		'flow_transport_in',
		'flow_transport_out',
		'cost_shed_demand',
		'flow_conversion_output',
		'constraint_nodal_energy_balance'
	];

	// @ts-ignore
	let ans: EnergyBalanceDataframes = {};

	for (const series_name of series_names) {
		if (energy_balance_data[series_name] !== undefined) {
			ans[series_name as keyof EnergyBalanceDataframes] = parse_timeseries_data(
				energy_balance_data[series_name]
			);
		}
	}

	return ans;
}

/**
 * Helper function that parses the CSV data as returned by the API.
 * It parses the CSV using Papaparse but first normalizes the CSV string returned by the API:
 * If the dataset only consists of one column, we transpose it s.t. the header consists of the years and it only has one more line containing the data.
 * This is done because ZEN Garden sometimes returns a pd.Series and sometimes a pd.Dataframe. In case a pd.Dataframe only consists of one column it is reformated to a Series-CSV Format.
 * Furthermore the function transforms the years: In the CSV data from the API it is 0 based normally indexed and this function translates it to actual years.
 * @param data_csv CSV string
 * @param start_year Start year (corresponds to the 0-index)
 * @param step_year Years between each index
 * @returns Papaparsed CSV
 */
function parse_csv(data_csv: string) {
	// Get first line of the csv data
	let first_line = data_csv.slice(0, data_csv.indexOf('\n'));

	// Get column names
	let headers = first_line.split(',');

	// If there are only two columns, we transpose the csv
	if (headers.length == 2) {
		let lines = data_csv.split('\n');
		let years = '';
		let data = '';

		for (const line of lines.slice(1, lines.length)) {
			if (line == '') {
				continue;
			}

			let line_split = line.split(',');
			years += line_split[0] + ',';
			data += line_split[1] + ',';
		}

		data_csv = years.substring(0, years.length - 1) + '\n' + data.substring(0, data.length - 1);
	}

	// Remove trailing new line if necessary
	if (data_csv.slice(-1) == '\n') {
		data_csv = data_csv.slice(0, -1);
	}

	// Parse CSV
	let data: Papa.ParseResult<Row> = Papa.parse(data_csv, {
		delimiter: ',',
		header: true,
		newline: '\n'
	});

	return data;
}

function parse_timeseries_data(entries: TimeSeriesResponseEntry[]): Entry[] {
	return entries.map((entry) => {
		let { d: data, t, ...rest } = entry;
		const [translation, scale] = t;

		// Compute cumulative sum
		let sum: number = 0;
		data = data.map((value) => (sum += value));

		// Apply scaling and translation
		data = data.map((value) => value * scale + translation);

		return { index: rest as Record<string, string>, data };
	});
}

function parse_unit_data(unit_csv: string): Papa.ParseResult<Row> {
	if (unit_csv.slice(-1) == '\n') {
		unit_csv = unit_csv.slice(0, unit_csv.length - 1);
	}

	return Papa.parse(unit_csv, { delimiter: ',', header: true, newline: '\n' });
}

function filter_zero_rows(data: Papa.ParseResult<Row>): Papa.ParseResult<Row> {
	// Filter out rows that only contain zeros
	data.data = data.data.filter((row: Row) => {
		return Object.keys(row).some((key: string) => {
			return !Number.isNaN(Number(key)) && !Number.isNaN(row[key]) && Math.abs(row[key]) > 0;
		});
	});
	return data;
}
