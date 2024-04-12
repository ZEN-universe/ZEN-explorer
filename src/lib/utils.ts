import type {
    Row,
    DatasetSelectors,
    Dataset,
    YearValue
} from "$lib/types";

interface DatasetContainer {
    [key: string]: YearValue;

}

export function filter_and_aggregate_data(
    data: Row[],
    dataset_filters: DatasetSelectors,
    dataset_aggregations: DatasetSelectors,
    years_exclude: any[] = [],
    normalise: boolean = false,
    offset_year: number = 0
): Dataset[] {
    let years_keys = Object.keys(data[0]).filter((k) => (!isNaN(Number(k)) && !years_exclude.includes(Number(k))));
    let dataset_keys = Object.keys(dataset_filters)
    let offset_years = Object.fromEntries(
        years_keys.map((k) => [k, Number(k) + offset_year]),
    );
    let datasets: DatasetContainer = {};
    let row: Row;
    for (row of data) {
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
        let dataset_label = row_dataset_keys.join("_");

        if (!(dataset_label in datasets)) {
            datasets[dataset_label] = Object.fromEntries(
                years_keys.map((k) => [offset_years[k], 0.0]),
            );
        }

        for (let year of years_keys) {
            datasets[dataset_label][offset_years[year]] += Number(row[year]);
        }
    }

    if (normalise) {
        let offset_year_keys = Object.values(offset_years)
        let year_totals = Object.fromEntries(
            offset_year_keys.map((k) => [k, 0.0]),
        );

        for (let year of offset_year_keys) {
            for (let dataset_label in datasets) {
                year_totals[year] += datasets[dataset_label][year]
            }
        }

        for (let year of offset_year_keys) {
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
        });
    }
    console.log(ans_datasets)
    return ans_datasets;
}