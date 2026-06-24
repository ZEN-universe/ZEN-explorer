import Papa, { type ParseResult } from 'papaparse';

import Entries from './entries';
import type { Row, TimeSeriesResponseEntry } from './types';

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
export function parseCSV(data_csv: string) {
	// Get first line of the csv data
	const first_line = data_csv.slice(0, data_csv.indexOf('\n'));

	// Get column names
	const headers = first_line.split(',');

	// If there are only two columns, we transpose the csv
	if (headers.length == 2) {
		const lines = data_csv.split('\n');
		let years = '';
		let data = '';

		for (const line of lines.slice(1, lines.length)) {
			if (line == '') {
				continue;
			}

			const line_split = line.split(',');
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
	const res: ParseResult<Row> = Papa.parse(data_csv, {
		delimiter: ',',
		header: true,
		newline: '\n'
	});

	// Filter out rows that only contain zeros
	res.data = res.data.filter((row: Row) => {
		return Object.keys(row).some((key: string) => {
			return !Number.isNaN(Number(key)) && !Number.isNaN(row[key]) && Math.abs(row[key]) > 0;
		});
	});
	return res;
}

/**
 * Parse the timeseries data as returned by the API used for the nodal and storage data.
 * It computes the cumulative sum of the data and applies the scaling and translation as returned by the API.
 * @param rawEntries Raw timeseries data as returned by the API
 * @returns Parsed timeseries data
 */
export function parseTimeseriesData(rawEntries: TimeSeriesResponseEntry[]): Entries {
	const parsedEntries = rawEntries.map((entry) => {
		// eslint-disable-next-line prefer-const
		let { d: data, t, ...rest } = entry;
		const [translation, scale] = t;

		// Compute cumulative sum
		let sum: number = 0;
		data = data.map((value) => (sum += value));

		// Apply scaling and translation
		data = data.map((value) => value * scale + translation);

		return { index: rest as Record<string, string>, data };
	});
	return new Entries(parsedEntries);
}

/**
 * Parse the unit data as returned by the API as a CSV string.
 * @param unit_csv CSV string
 * @returns Papaparsed CSV
 */
export function parseUnitData(unit_csv: string): ParseResult<Row> {
	if (unit_csv.slice(-1) == '\n') {
		unit_csv = unit_csv.slice(0, unit_csv.length - 1);
	}

	return Papa.parse(unit_csv, { delimiter: ',', header: true, newline: '\n' });
}
