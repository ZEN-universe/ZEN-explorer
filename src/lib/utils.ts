import type {
    Row,
    DatasetSelectors,
    Dataset,
    DatasetContainer
} from "$lib/types";


export function rename_field(papa_result: Papa.ParseResult<any>, old_name: string, new_name: string) {
    for (let i of papa_result.data) {
        let new_val = Object.getOwnPropertyDescriptor(i, old_name)

        if (new_val === undefined) {
            continue
        }

        Object.defineProperty(
            i,
            new_name,
            new_val,
        );
        delete i[old_name];
    }
}

export function group_data(new_name: string, group_data: [string, Papa.ParseResult<any>][]): Papa.ParseResult<any> {
    let ans: Papa.ParseResult<any> | undefined = undefined;

    for (let group_pair of group_data) {
        rename_field(group_pair[1], group_pair[0], new_name)
        if (ans === undefined) {
            ans = structuredClone(group_pair[1])
        } else {
            ans.data = ans.data.concat(group_pair[1].data)
        }
    }

    return ans!
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
 * The attribute name defines the field_name of the provided data and the attribute valie has to be a list of strings of the values to include in the answer. For example:
 * {
 *  technology: ["natural_gas_storage", "battery"]
 * }
 * will include all rows that have technology "natural_gas_storage" or "battery".
 * @param dataset_aggregations - An object that defines which rows to aggregate in the answer.
 * The attribute name defines the field_name of the provided data and the attribute valie has to be a list of strings of the values to include in the answer. For example:
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
    plot_type: string = "bar",
    label_suffix: string = ""
): Dataset[] {
    if (data.length == 0) {
        return []
    }

    let years_keys = Object.keys(data[0]).filter((k) => (!isNaN(Number(k)) && !years_exclude.includes(Number(k))));
    let dataset_keys = Object.keys(dataset_filters)
    let datasets: DatasetContainer = {};

    for (const row of data) {
        let skip = false;
        for (let key in dataset_filters) {
            if (!dataset_filters[key].includes(row[key])) {
                skip = true;
                break
            }
        }

        for (let aggregate_key of Object.keys(dataset_aggregations)) {
            if (
                !dataset_aggregations[aggregate_key].includes(
                    row[aggregate_key],
                )
            ) {
                skip = true;
                break
            }
        }

        if (skip) { continue; }

        let row_dataset_keys = [];

        for (let key of dataset_keys) {
            row_dataset_keys.push(row[key]);
        }

        let dataset_label = row_dataset_keys.join("_") + label_suffix;

        if (!(dataset_label in datasets)) {
            datasets[dataset_label] = Object.fromEntries(
                years_keys.map((k) => [k, 0.0]),
            );
        }

        for (let year of years_keys) {
            let current = Number(row[year]);

            if (row[year] == "inf") {
                current = Infinity
            }
            datasets[dataset_label][year] += current;
        }
    }

    if (normalise) {
        let year_totals = Object.fromEntries(
            years_keys.map((k) => [k, 0.0]),
        );

        for (let year of years_keys) {
            for (let dataset_label in datasets) {
                year_totals[year] += datasets[dataset_label][year]
            }
        }

        for (let year of years_keys) {
            for (let dataset_label in datasets) {
                if (year_totals[year] == 0) {
                    datasets[dataset_label][year] = 0
                } else {
                    datasets[dataset_label][year] *= 1 / year_totals[year]
                }
            }
        }
    }

    let ans_datasets: Dataset[] = [];
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