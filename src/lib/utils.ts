import type { Row, DatasetSelectors, Dataset, DatasetContainer } from '$lib/types';

/**
 * Renames the column of a Papaparsed CSV
 * @param papa_result Papaparsed CSV
 * @param old_name Old name of the column
 * @param new_name New name of the column
 */
export function rename_field(
	papa_result: Papa.ParseResult<any>,
	old_name: string,
	new_name: string
) {
	for (let i of papa_result.data) {
		let new_val = Object.getOwnPropertyDescriptor(i, old_name);

		if (new_val === undefined) {
			continue;
		}

		Object.defineProperty(i, new_name, new_val);
		delete i[old_name];
	}
}

/**
 * This function takes a new column name and a list of pairs of an old column name and a Papaparsed CSV.
 * It renames the old column name of the CSV into the new CSV and finally adds all the parsed data into one CSV.
 * For example, if you call the function with ("new_name", [["old_name_1", CSV1], ["old_name_2", CSV2]])
 * it will rename the column "old_name_1" in the CSV1 into "new_name" and rename the column "old_name_2" of the CSV2 into "new_name" and group all the rows into one list.
 * @param new_name
 * @param group_data
 * @returns
 */
export function group_data(
	new_name: string,
	group_data: [string, Papa.ParseResult<any>][]
): Papa.ParseResult<any> {
	let ans: Papa.ParseResult<any> | undefined = undefined;

	for (let group_pair of group_data) {
		rename_field(group_pair[1], group_pair[0], new_name);
		if (ans === undefined) {
			ans = structuredClone(group_pair[1]);
		} else {
			ans.data = ans.data.concat(group_pair[1].data);
		}
	}

	return ans!;
}

/**
 * This function takes a set of rows and creates aggregated plots out of these rows. The result can be directly used in d3 plots.
 *
 * @param data - An array of row objects of the form {<field_name>: <field_value>, ..., <year>: value}. For example:
 * {
 *   2024: "0.0"
 *   2025: "1.234"
 *   node: "CH"
 *   technology: "natural_gas_storage"
 * }
 * @param dataset_filters - An object that defines which rows to include in the answer.
 * The attribute name defines the field_name of the provided data and the attribute value
 * has to be a list of strings of the values to include in the answer. For example:
 * {
 *  technology: ["natural_gas_storage", "battery"]
 * }
 * will include all rows that have the technology "natural_gas_storage" or "battery".
 * @param dataset_aggregations - An object that defines which rows to aggregate in the answer.
 * The attribute name defines the field_name of the provided data and the attribute value has
 * to be a list of strings of the values to include in the answer. For example:
 * {
 *  node: ["CH", "DE"]
 * }
 * will sum all rows that have the node "CH" or "DE" into one dataset.
 * @param years_exclude - A list of years to exclude from the response
 * @param normalise - A boolean value that specifies if the returned values should be normalised or not
 * @param plot_type - The D3 Plottype
 * @param label_suffix - An optional suffix to the label of the plot.
 * @returns
 */
export function filter_and_aggregate_data(
	data: Row[],
	dataset_filters: DatasetSelectors,
	dataset_aggregations: DatasetSelectors,
	years_exclude: any[] = [],
	normalise: boolean = false,
	plot_type: string = 'bar',
	label_suffix: string = ''
): Dataset[] {
	if (data.length == 0) {
		return [];
	}

	let years_keys = Object.keys(data[0]).filter(
		(k) => !isNaN(Number(k)) && !years_exclude.includes(Number(k))
	);
	let dataset_keys = Object.keys(dataset_filters);
	let datasets: DatasetContainer = {};

	for (const row of data) {
		let skip = false;

		// If the row does not contain one of the dataset_filters we skip it.
		for (let key in dataset_filters) {
			if (!dataset_filters[key].includes(row[key])) {
				skip = true;
				break;
			}
		}

		// Same for the aggregations, if the row does not contain any of the aggregations we skip it.
		for (let key of Object.keys(dataset_aggregations)) {
			if (!dataset_aggregations[key].includes(row[key])) {
				skip = true;
				break;
			}
		}

		if (skip) {
			continue;
		}

		// Since we might aggregate several indices, we have to concat the label into one string
		let row_dataset_keys = [];

		for (let key of dataset_keys) {
			row_dataset_keys.push(row[key]);
		}

		// Define new label by concatenating all indices
		let dataset_label = row_dataset_keys.join('_') + label_suffix;

		// Initialize new row with all zeroes
		if (!(dataset_label in datasets)) {
			datasets[dataset_label] = Object.fromEntries(years_keys.map((k) => [k, 0.0]));
		}

		// Aggregate the values
		for (let year of years_keys) {
			let current = Number(row[year]);

			if (row[year] == 'inf') {
				current = Infinity;
			}
			datasets[dataset_label][year] += current;
		}
	}

	// Normalize values if necessary
	if (normalise) {
		let year_totals = Object.fromEntries(years_keys.map((k) => [k, 0.0]));

		for (let year of years_keys) {
			for (let dataset_label in datasets) {
				year_totals[year] += datasets[dataset_label][year];
			}
		}

		for (let year of years_keys) {
			for (let dataset_label in datasets) {
				if (year_totals[year] == 0) {
					datasets[dataset_label][year] = 0;
				} else {
					datasets[dataset_label][year] *= 1 / year_totals[year];
				}
			}
		}
	}

	let ans_datasets: Dataset[] = [];

	// Filter Rows that contain NaNs
	for (let label in datasets) {
		if (Object.values(datasets[label]).includes(NaN)) {
			continue;
		}

		ans_datasets.push({
			label: label,
			data: datasets[label],
			type: plot_type
		});
	}

	return ans_datasets;
}

/**
 * Takes a string and replaces all underscores with spaces and capitalizes the first letter.
 * @param value string to be formatted
 * @returns formatted string
 * @example
 * // Input: "hello_world"
 * // Output: "Hello world"
 */
export function stringify(value: string) {
	let res = value.replace(/_/g, ' ');
	return res.charAt(0).toUpperCase() + res.slice(1);
}

/**
 * Remove duplicates from an array
 * @param array array to be filtered
 * @returns filtered array
 */
export function remove_duplicates<T>(array: T[]): T[] {
	return Array.from(new Set(array));
}

export function to_options(arr: string[]): { value: string; label: string }[] {
	return arr.map((item) => ({
		value: item,
		label: item
	}));
}
