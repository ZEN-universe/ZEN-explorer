<script lang="ts">
    import SolutionFilter from "../../../components/SolutionFilter.svelte";
    import AllCheckbox from "../../../components/AllCheckbox.svelte";
    import BarPlot from "../../../components/BarPlot.svelte";
    import Dropdown from "../../../components/Dropdown.svelte";

    import type { ActivatedSolution, Row } from "$lib/types";
    import { get_full_ts } from "$lib/temple";
    import { filter_and_aggregate_data } from "$lib/utils";
    import Papa from "papaparse";
    import { get_variable_name } from "$lib/variables";
    import ToggleButton from "../../../components/ToggleButton.svelte";
    import type { ChartConfiguration, Point } from "chart.js";

    interface StringList {
        [key: string]: string[];
    }

    let data: Papa.ParseResult<Row> | null = null;
    let chargeData: Papa.ParseResult<Row> | null = null;
    let dischargeData: Papa.ParseResult<Row> | null = null;
    let spillageData: Papa.ParseResult<Row> | null = null;
    let inflowData: Papa.ParseResult<Row> | null = null;
    let filtered_data: any[] | null = null;
    let charge_filtered_data: any[] | null = null;
    let discharge_filtered_data: any[] | null = null;
    let inflow_filtered_data: any[] | null = null;
    let spillage_filtered_data: any[] | null = null;
    let carriers: string[] = [];
    let locations: string[] = [];
    let technologies: string[] = [];
    let selected_solution: ActivatedSolution | null = null;
    let unit: Papa.ParseResult<Row> | null = null;
    let selected_variable: string | null = "storage_level";
    let selected_carrier: string | null = null;
    let selected_aggregation = "technology";
    let selected_technologies: string[] = [];
    let selected_locations: string[] = [];
    let solution_loading: boolean = false;
    let fetching: boolean = false;
    let plot_name: string = "";
    let plot_name_flows: string = "";
    let subdivision: boolean = true;
    let years: number[] = [];
    let selected_year: number = 0;

    let window_sizes = ["Hourly", "Daily", "Weekly", "Monthly"];
    let selected_window_size = "Hourly";

    let level_plot_zoom: (min: number, max: number) => void;
    let flow_plot_zoom: (min: number, max: number) => void;

    let plot_config: ChartConfiguration<"line", { x: string; y: number }[], string> = {
        counter: 1,
        type: "line",
        data: { datasets: [] as any[], labels: [] as string[] },
        options: {
            animation: false,
            normalized: true,
            elements: {
                point: {
                    radius: 0,
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
                y: {
                    type: "linear",
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Storage Level",
                    },
                },
            },
            borderWidth: 1,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        modifierKey: "ctrl",
                        mode: "x",
                        onPanComplete: (event) => {
                            flow_plot_zoom(event.chart.scales.x.min, event.chart.scales.x.max);
                        },
                    },
                    zoom: {
                        drag: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: "x",
                        onZoomComplete: (event) => {
                            flow_plot_zoom(event.chart.scales.x.min, event.chart.scales.x.max);
                        },
                    },
                    limits: {
                        x: {minRange: 10}
                    },
                },
            },
        },
    };

    let plot_config_flows: ChartConfiguration<"line", { x: string; y: number }[], string> = {
        counter: 1,
        type: "line",
        data: { datasets: [] as any[], labels: [] as string[] },
        options: {
            animation: false,
            normalized: true,
            elements: {
                point: {
                    radius: 0,
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
                y: {
                    type: "linear",
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Storage Flow",
                    },
                },
            },
            borderWidth: 1,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        modifierKey: "ctrl",
                        mode: "x",
                        onPanComplete: (event) => {
                            level_plot_zoom(event.chart.scales.x.min, event.chart.scales.x.max);
                        },
                    },
                    zoom: {
                        drag: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: "x",
                        onZoomComplete: (event) => {
                            level_plot_zoom(event.chart.scales.x.min, event.chart.scales.x.max);
                        },
                    },
                    limits: {
                        x: {minRange: 10}
                    },
                },
            },
        },
    };

    /**
     * This function sets all the necessary variables back to the initial state in order to reset the plot.
     *
     */
    function reset_data_selection() {
        selected_locations = locations;
        selected_technologies = technologies;
        selected_aggregation = "node";
    }

    /**
     * This function fetches the the data from the api of the selected values in the form
     */
    async function fetch_data() {
        data = null;
        if (selected_solution === null) {
            return;
        }
        // Calculate index of year
        let year_index = Math.floor(
            (selected_year - selected_solution.detail.system.reference_year) /
                selected_solution.detail.system.interval_between_years,
        );

        let window_size = 1;

        switch (selected_window_size) {
            case "Daily":
                window_size = 24;
                break;
            case "Weekly":
                window_size = 168;
                break;
            case "Monthly":
                window_size = 720;
                break;
        }

        let levelResponse = await get_full_ts(
            selected_solution!.solution_name,
            get_variable_name("storage_level"),
            selected_solution!.scenario_name,
            year_index,
            window_size,
        );
        data = levelResponse.data;
        unit = levelResponse.unit;

        let chargeResponse = await get_full_ts(
            selected_solution!.solution_name,
            get_variable_name("flow_storage_charge"),
            selected_solution!.scenario_name,
            year_index,
            window_size,
        );
        chargeData = chargeResponse.data;

        let dischargeResponse = await get_full_ts(
            selected_solution!.solution_name,
            get_variable_name("flow_storage_discharge"),
            selected_solution!.scenario_name,
            year_index,
            window_size,
        );
        dischargeData = dischargeResponse.data;

        let spillageResponse = await get_full_ts(
            selected_solution!.solution_name,
            get_variable_name("flow_storage_spillage"),
            selected_solution!.scenario_name,
            year_index,
            window_size,
        );
        spillageData = spillageResponse.data;

        let inflowResponse = await get_full_ts(
            selected_solution!.solution_name,
            get_variable_name("flow_storage_inflow"),
            selected_solution!.scenario_name,
            year_index,
            window_size,
        );
        inflowData = inflowResponse.data;
    }

    /**
     * This function is called is called whenever the solution filter sends a change event.
     * It resets all the selected values of the form.
     */
    async function solution_changed() {
        if (selected_solution === null) {
            return;
        }

        fetching = true;
        selected_year = years[0];

        await fetch_data();

        update_carriers();
        update_technologies();
        update_locations();
        reset_data_selection();
        update_plot_data();
        fetching = false;
    }

    /**
     * This function is called, when the carrier is changed. It updates all the necessary values for further selection in the form.
     */
    async function data_changed() {
        fetching = true;

        await fetch_data();

        update_technologies();
        update_locations();
        reset_data_selection();
        update_plot_data();

        fetching = false;
    }

    /**
     * This function updates the avaible locations for the current variable selection.
     */
    function update_locations() {
        locations = Array.from(new Set(data!.data.map((a) => a.node)));
        selected_locations = locations;
    }

    /**
     * This function returns the unit of the currently selected variable
     */
    function get_unit() {
        try {
            return unit!.data[0][0];
        } catch {
            return "";
        }
    }

    /**
     * This function updates the avaible carriers for the current variable selection.
     */
    function update_carriers() {
        carriers = [];
        if (!data) {
            return;
        }
        let all_technologies = Array.from(data!.data.map((a) => a.technology));
        // Add all the available carriers to the set of carriers for the current set of technologies
        data!.data.forEach((element) => {
            let current_technology = element.technology;
            let current_carrier =
                selected_solution!.detail.reference_carrier[current_technology];

            if (
                !carriers.includes(current_carrier) &&
                all_technologies.includes(element.technology)
            ) {
                carriers.push(current_carrier);
            }
        });

        if (carriers.length > 0) {
            selected_carrier = carriers[0];
        }
    }

    /**
     * This function updates the available technologies depending on the currently selected carrier and resets the currently selected technologies.
     */
    function update_technologies() {
        let all_technologies = Array.from(
            new Set(data!.data.map((a: any) => a.technology)),
        );

        technologies = all_technologies.filter(
            (technology) =>
                selected_solution?.detail.reference_carrier[technology] ==
                selected_carrier,
        );
        selected_technologies = technologies;
    }

    /**
     * This function updates the data for the plot depending on the currently selected values.
     */
    function update_plot_data() {
        if (selected_aggregation == "technology") {
            selected_locations = locations;
        } else {
            selected_technologies = technologies;
        }

        if (
            selected_variable == null ||
            selected_locations.length == 0 ||
            selected_technologies.length == 0 ||
            data === null ||
            chargeData === null ||
            dischargeData === null ||
            inflowData === null ||
            spillageData === null
        ) {
            filtered_data = null;
            return;
        }

        let dataset_selector: StringList = {};
        let datasets_aggregates: StringList = {};
        dataset_selector["technology"] = selected_technologies;
        datasets_aggregates["node"] = selected_locations;

        filtered_data = filter_and_aggregate_data(
            data.data,
            dataset_selector,
            datasets_aggregates,
            [],
            false,
            "line",
            "",
        ).map((dataset) => {
            return {
                ...dataset,
                fill: 'origin',
            }
        });
        charge_filtered_data = filter_and_aggregate_data(
            chargeData.data,
            dataset_selector,
            datasets_aggregates,
            [],
            false,
            "line",
            "_charge",
        ).map((dataset) => {
            return {
                ...dataset,
                stepped: true,
                fill: 'origin',
            }
        });
        discharge_filtered_data = filter_and_aggregate_data(
            dischargeData.data,
            dataset_selector,
            datasets_aggregates,
            [],
            false,
            "line",
            "_discharge",
        ).map((dataset) => {
            let data: { [key: string]: number } = {};
            for (let i in dataset.data) {
                data[i] = dataset.data[i] > 0 ? -dataset.data[i] : dataset.data[i];
            }
            return {
                data,
                label: dataset.label,
                type: dataset.type,
                stepped: true,
                fill: 'origin',
            }
        });
        spillage_filtered_data = filter_and_aggregate_data(
            spillageData.data,
            dataset_selector,
            datasets_aggregates,
            [],
            false,
            "line",
            "_spillage",
        ).map((dataset) => {
            let data: { [key: string]: number } = {};
            for (let i in dataset.data) {
                data[i] = dataset.data[i] > 0 ? -dataset.data[i] : dataset.data[i];
            }
            return {
                data,
                label: dataset.label,
                type: dataset.type,
                stepped: true,
                fill: 'origin',
            }
        });
        inflow_filtered_data = filter_and_aggregate_data(
            inflowData.data,
            dataset_selector,
            datasets_aggregates,
            [],
            false,
            "line",
            "_inflow",
        ).map((dataset) => {
            return {
                ...dataset,
                stepped: true,
                fill: 'origin',
            }
        });

        plot_config.data = {
            datasets: filtered_data,
            labels: Object.keys(filtered_data[0].data),
        };
        plot_config_flows.data = {
            datasets: charge_filtered_data.concat(discharge_filtered_data).concat(inflow_filtered_data).concat(spillage_filtered_data),
            labels: Object.keys(filtered_data[0].data),
        };

        if (!subdivision) {
            let new_data: { [key: string]: number } = {};
            for (const i in filtered_data[0].data) {
                new_data[i] = filtered_data
                    .map((j) => j.data[i])
                    .reduce((partialSum, a) => partialSum + a, 0);
            }
            let new_charge: { [key: string]: number } = {};
            for (const i in charge_filtered_data[0].data) {
                new_charge[i] = charge_filtered_data
                    .map((j) => j.data[i])
                    .reduce((partialSum, a) => partialSum + a, 0);
            }
            let new_discharge: { [key: string]: number } = {};
            for (const i in discharge_filtered_data[0].data) {
                new_discharge[i] = discharge_filtered_data
                    .map((j) => j.data[i])
                    .reduce((partialSum, a) => partialSum + a, 0);
            }
            let new_inflow: { [key: string]: number } = {};
            for (const i in inflowData.data[0]) {
                new_inflow[i] = inflowData.data
                    .map((j) => j.data[i])
                    .reduce((partialSum, a) => partialSum + a, 0);
            }
            let new_spillage: { [key: string]: number } = {};
            for (const i in spillageData.data[0]) {
                new_spillage[i] = spillageData.data
                    .map((j) => j.data[i])
                    .reduce((partialSum, a) => partialSum + a, 0);
            }

            plot_config.data = {
                datasets: [
                    {
                        data: Object.values(new_data),
                        label: "Storage level",
                        type: "line",
                        borderColor: "black",
                        fill: 'origin',
                        stepped: true,
                    },
                ],
                labels: Object.keys(new_data),
            };
            plot_config.data = {
                datasets: [
                    {
                        data: Object.values(new_charge),
                        label: "Flow Storage Charge",
                        type: "line",
                        borderColor: "blue",
                        stepped: true,
                    },
                    {
                        data: Object.values(new_discharge),
                        label: "Flow Storage Discharge",
                        type: "line",
                        borderColor: "red",
                        stepped: true,
                    },
                    {
                        data: Object.values(new_inflow),
                        label: "Flow Storage Discharge",
                        type: "line",
                        borderColor: "red",
                        stepped: true,
                    },
                    {
                        data: Object.values(new_spillage),
                        label: "Flow Storage Discharge",
                        type: "line",
                        borderColor: "red",
                        stepped: true,
                    },
                ],
                labels: Object.keys(new_data),
            };
        }

        // @ts-ignore
        plot_config.options.scales.y.title.text =
            selected_variable + " [" + get_unit() + "]";

        let solution_names = selected_solution!.solution_name.split(".");

        plot_name = [
            solution_names[solution_names?.length - 1],
            selected_solution?.scenario_name,
            selected_variable,
            selected_carrier,
        ].join("_");
    }
</script>

<div class="row">
    <div class="col">
        <h2>The Energy Balance Storage</h2>
    </div>
</div>
<div class="row" style="z-index: 1; position: relative;">
    <div class="col position-relative">
        <div class="filters">
            <div class="accordion" id="accordionExample">
                <div class="accordion-item solution-selection">
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseOne"
                            aria-expanded="true"
                            aria-controls="collapseOne"
                        >
                            Solution Selection
                        </button>
                    </h2>
                    <div
                        id="collapseOne"
                        class="accordion-collapse collapse show"
                        data-bs-parent="#accordionExample"
                    >
                        <div class="accordion-body">
                            <SolutionFilter
                                bind:selected_solution
                                bind:loading={solution_loading}
                                bind:years
                                on:solution_selected={() => {
                                    solution_changed();
                                }}
                                enabled={!fetching && !solution_loading}
                            />
                        </div>
                    </div>
                </div>
                {#if !solution_loading && selected_solution}
                    <div class="accordion-item variable-selction">
                        <h2 class="accordion-header">
                            <button
                                class="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseTwo"
                                aria-expanded="false"
                                aria-controls="collapseTwo"
                            >
                                Variable Selection
                            </button>
                        </h2>
                        <div
                            id="collapseTwo"
                            class="accordion-collapse collapse"
                            data-bs-parent="#accordionExample"
                        >
                            <div class="accordion-body">
                                {#if carriers.length > 0}
                                    <h3>Carrier</h3>
                                    <select
                                        bind:value={selected_carrier}
                                        on:change={data_changed}
                                        disabled={fetching || solution_loading}
                                    >
                                        {#each carriers as carrier}
                                            <option value={carrier}>
                                                {carrier}
                                            </option>
                                        {/each}
                                        disabled={fetching || solution_loading}
                                    </select>
                                    <h3>Year</h3>
                                    <Dropdown
                                        bind:options={years}
                                        bind:selected_option={selected_year}
                                        on:selection-changed={data_changed}
                                        enabled={!fetching && !solution_loading}
                                    ></Dropdown>
                                    <h3>Smoothing Window Size</h3>
                                    <Dropdown
                                        bind:options={window_sizes}
                                        bind:selected_option={selected_window_size}
                                        on:selection-changed={data_changed}
                                        enabled={!fetching && !solution_loading}
                                    ></Dropdown>
                                {/if}
                            </div>
                        </div>
                    </div>
                    {#if data && selected_carrier && technologies.length > 0 && locations.length > 0}
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button
                                    class="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapseThree"
                                    aria-expanded="false"
                                    aria-controls="collapseThree"
                                >
                                    Data Selection
                                </button>
                            </h2>
                            <div
                                id="collapseThree"
                                class="accordion-collapse collapse"
                                data-bs-parent="#accordionExample"
                            >
                                <div class="accordion-body">
                                    <div class="row"></div>
                                    <h3>Technology Subdivision</h3>
                                    <ToggleButton
                                        bind:value={subdivision}
                                        on:change={update_plot_data}
                                    ></ToggleButton>

                                    <h3>Node</h3>
                                    <AllCheckbox
                                        bind:selected_elements={selected_locations}
                                        bind:elements={locations}
                                        on:selection-changed={update_plot_data}
                                    ></AllCheckbox>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>
<div class="col">
    <div class="row mt-4">
        {#if solution_loading || fetching}
            <div class="text-center">
                <div class="spinner-border center" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        {:else if technologies.length == 0}
            <div class="text-center">No technologies with this selection.</div>
        {:else if carriers.length == 0}
            <div class="text-center">No carriers with this selection.</div>
        {:else if selected_solution == null}
            <div class="text-center">No solution selected.</div>
        {:else if filtered_data == null}
            <div class="text-center">No data with this selection.</div>
        {:else if locations.length == 0}
            <div class="text-center">No locations with this selection.</div>
        {:else if filtered_data.length == 0}
            <div class="text-center">No data with this selection.</div>
        {:else}
            <!-- TODO: Sync zoom between these two plots -->
            <BarPlot bind:config={plot_config} bind:plot_name zoom={true} bind:zoom_rect={level_plot_zoom}
            ></BarPlot>
            <BarPlot bind:config={plot_config_flows} bind:plot_name={plot_name_flows} zoom={true} bind:zoom_rect={flow_plot_zoom}
            ></BarPlot>
        {/if}
    </div>
</div>
