import type {
    Row,
    DatasetSelectors,
    Dataset,
    YearValue
} from "$lib/types";

interface DatasetContainer {
    [key: string]: YearValue;
}

interface GroupData {
    [key: string]: Papa.ParseResult<any>;
}

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
                datasets[dataset_label][year] *= 1 / year_totals[year]
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