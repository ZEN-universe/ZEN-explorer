import { env } from '$env/dynamic/public';
import Papa from 'papaparse';
import type {
	Solution,
	ComponentTotal,
	SolutionDetail,
	EnergyBalanceDataframes,
	Row,
	ProductionDataframes,
	CostsDataframes,
	StorageDataframes
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
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
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
 * @param component_name Name of the compoennt
 * @param scenario_name Name of the scenario
 * @param year Year
 * @returns Promise of the TimeSeries as returned by the API
 */
export async function get_full_ts(
	solution_name: string,
	component_name: string,
	scenario_name: string,
	year: number = 0,
	window_size: number = 1
): Promise<ComponentTotal> {
	const fetch_url =
		env.PUBLIC_TEMPLE_URL +
		`solutions/get_full_ts/${solution_name}/${component_name}?scenario=${scenario_name}&year=${year}&rolling_average_size=${window_size}`;

	let component_data_request = await fetch(fetch_url, { cache: 'no-store' });

	if (!component_data_request.ok) {
		alert('Error when fetching ' + fetch_url);
		throw new Error('Error when fetching ' + fetch_url);
	}

	let component_data = await component_data_request.json();

	let data: Papa.ParseResult<Row> = parse_csv(component_data.data_csv);
	let unit: Papa.ParseResult<Row> | null = null;

	// Add unit if necessary
	if (component_data.unit != null) {
		if (component_data.unit.slice(-1) == '\n') {
			component_data.unit = component_data.unit.slice(0, component_data.unit.length - 1);
		}

		unit = Papa.parse(component_data.unit, { delimiter: ',', header: true, newline: '\n' });
	}

	const ans: ComponentTotal = {
		unit: unit,
		data: data
	};

	return ans;
}

/**
 * Helper function to fetch the total of a component from the Temple. It removes rows that only contain zeros.
 * @param solution_name Name of the solution
 * @param component_name Name of the component
 * @param scenario_name Name of the scenario
 * @param start_year Start year
 * @param step_year Number of steps between years
 * @param year Year to fetch
 * @returns Promise of the ComponentTotal as returned by the temple.
 */
export async function get_component_total(
	solution_name: string,
	component_name: string,
	scenario_name: string,
	start_year: number = 0,
	step_year: number = 1,
	year: number = 0
): Promise<ComponentTotal> {
	const fetch_url =
		env.PUBLIC_TEMPLE_URL +
		`solutions/get_total/${solution_name}/${component_name}?scenario=${scenario_name}&year=${year}`;

	let component_data_request = await fetch(fetch_url, { cache: 'no-store' });

	if (!component_data_request.ok) {
		alert('Error when fetching ' + fetch_url);
		throw new Error('Error when fetching ' + fetch_url);
	}

	let component_data = await component_data_request.json();
	let data: Papa.ParseResult<Row> = filter_zero_rows(
		parse_csv(component_data.data_csv, start_year, step_year)
	);
	let unit: Papa.ParseResult<Row> | null = null;

	// Parse unit data if necessary
	if (component_data.unit != null) {
		unit = parse_unit_data(component_data.unit);
	}

	const ans: ComponentTotal = {
		unit: unit,
		data: data
	};

	return ans;
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
	let unit = await (
		await fetch(
			env.PUBLIC_TEMPLE_URL +
				`solutions/get_unit/${solution_name}/${component_name}?scenario=${scenario_name}`,
			{ cache: 'no-store' }
		)
	).json();

	if (unit != null) {
		unit = Papa.parse(unit, { delimiter: ',', header: true, newline: '\n' });
	}
	return unit;
}

export async function get_production(
	solution_name: string,
	scenario_name: string,
	start_year: number = 0,
	step_year: number = 1
): Promise<ProductionDataframes> {
	const url =
		env.PUBLIC_TEMPLE_URL + `solutions/get_production/${solution_name}?scenario=${scenario_name}`;

	let production_request = await fetch(url, { cache: 'no-store' });

	if (!production_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}

	let production_data = await production_request.json();

	for (const key in production_data) {
		if (key == 'unit' || production_data[key] === undefined) {
			continue;
		}

		production_data[key] = filter_zero_rows(parse_csv(production_data[key], start_year, step_year));
	}

	production_data.unit = parse_unit_data(production_data.unit || '');

	return production_data;
}

export async function get_costs(
	solution_name: string,
	scenario_name: string,
	start_year: number = 0,
	step_year: number = 1
): Promise<CostsDataframes> {
	const url =
		env.PUBLIC_TEMPLE_URL + `solutions/get_costs/${solution_name}?scenario=${scenario_name}`;
	let costs_request = await fetch(url, { cache: 'no-store' });

	if (!costs_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}

	let costs_data = await costs_request.json();

	for (const key in costs_data) {
		if (key == 'unit' || costs_data[key] === undefined) {
			continue;
		}

		costs_data[key] = filter_zero_rows(parse_csv(costs_data[key], start_year, step_year));
	}

	costs_data.unit = parse_unit_data(costs_data.unit || '');

	return costs_data;
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
		'flow_conversion_output'
	];

	// @ts-ignore
	let ans: EnergyBalanceDataframes = {};

	for (const series_name of series_names) {
		if (energy_balance_data[series_name] !== undefined) {
			// @ts-ignore
			ans[series_name] = parse_csv(energy_balance_data[series_name]);
		}
	}

	return ans;
}

export async function get_storage(
	solution_name: string,
	scenario_name: string,
	year_index: number = 0,
	window_size: number = 1
): Promise<StorageDataframes> {
	const url =
		env.PUBLIC_TEMPLE_URL +
		`solutions/get_storage/${solution_name}?scenario=${scenario_name}&year=${year_index}&rolling_average_size=${window_size}`;

	let storage_request = await fetch(url, { cache: 'no-store' });

	if (!storage_request.ok) {
		alert('Could not fetch ' + url);
		throw new Error('Could not fetch ' + url);
	}

	let storage_data = await storage_request.json();

	for (const key in storage_data) {
		if (key == 'unit' || storage_data[key] === undefined) {
			continue;
		}

		storage_data[key] = parse_csv(storage_data[key]);
	}
	storage_data.unit = parse_unit_data(storage_data.unit || '');

	return storage_data;
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
function parse_csv(data_csv: string, start_year: number = 0, step_year: number = 1) {
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

	// Define preprocess function that translates the years of index to actual years because the transform_headers visits the function twice and therefore does Number(h) * 2 step_year + 2 * start_year
	function preprocessCSV(input: string): string {
		let [header, ...lines] = input.split('\n');
		let headers = header.split(',');

		// Modify numeric headers
		headers = headers.map((h) =>
			!isNaN(Number(h)) ? String(Number(h) * step_year + start_year) : h
		);

		return [headers.join(','), ...lines].join('\n');
	}
	// Parse CSV
	let data: Papa.ParseResult<Row> = Papa.parse(preprocessCSV(data_csv), {
		delimiter: ',',
		header: true,
		newline: '\n'
	});

	return data;
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
