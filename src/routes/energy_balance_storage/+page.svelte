<script lang="ts">
    import SolutionFilter from "../../components/SolutionFilter.svelte";
    import AllCheckbox from "../../components/AllCheckbox.svelte";
    import Radio from "../../components/Radio.svelte";
    import BarPlot from "../../components/BarPlot.svelte";
    import type { ActivatedSolution, Row } from "$lib/types";
    import { get_component_total } from "$lib/temple";
    import { filter_and_aggregate_data } from "$lib/utils";
    import { tick } from "svelte";
    import Papa from "papaparse";
    import { get_variable_name } from "$lib/variables";

    interface StringList {
        [key: string]: string[];
    }

    let data: Papa.ParseResult<Row> | null = null;
    let filtered_data: any[] | null = null;
    let variables: string[] = [];
    let carriers: string[] = [];
    let locations: string[] = [];
    let years: number[] = [];
    let technologies: string[] = [];
    let selected_solution: ActivatedSolution | null = null;
    let aggregation_options = ["technology", "node"];
    let unit: Papa.ParseResult<Row> | null = null;
    let selected_variable: string | null = null;
    let selected_carrier: string | null = null;
    let selected_aggregation = "technology";
    let selected_technologies: string[] = [];
    let selected_years: number[] = [];
    let selected_locations: string[] = [];
    let solution_loading: boolean = false;
    let datasets: any[] = [];
    let fetching: boolean = false;
    let plot_name: string = "";
    let plot_options = ["Line", "Bar (stacked)"];
    let selected_plot = "Line";

    let config = {
        type: "bar",
        data: { datasets: datasets },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Year",
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: selected_variable,
                    },
                },
            },
        },
    };

    /**
     * This function sets all the necessary variables back to the initial state in order to reset the plot.
     *
     */
    async function reset_data_selection() {
        selected_locations = locations;
        selected_technologies = technologies;
        selected_years = years;
        selected_aggregation = "node";
        await tick();
    }

    /**
     * This function fetches the the data from the api of the selected values in the form
     */
    async function fetch_data() {
        fetching = true;
        data = null;
        await tick();
        if (selected_variable === null) {
            fetching = false;
            return;
        }

        let fetched = await get_component_total(
            selected_solution!.solution_name,
            get_variable_name(selected_variable),
            selected_solution!.scenario_name,
            selected_solution!.detail.system.reference_year,
            selected_solution!.detail.system.interval_between_years,
        );

        data = fetched.data;
        unit = fetched.unit;
        fetching = false;
    }

    /**
     * This function is called is called whenever the solution filter sends a change event.
     * It resets all the selected values of the form.
     */
    function solution_changed() {
        variables = [
            "storage_level",
            "flow_storage_charge",
            "flow_storage_discharge",
            "flow_storage_inflow",
            "flow_storage_spillage",
        ].filter((a) => selected_solution!.components.includes(a));
        data = null;
        selected_variable = null;
        filtered_data = null;
        selected_carrier = null;
    }

    /**
     * This function is called, whenever the variable in the form is changed.
     * It will fetch the necessary data from the API.
     */
    async function variable_changed() {
        fetching = true;
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
    function carrier_changed() {
        update_carriers();
        update_technologies();
        update_locations();
        reset_data_selection();
        update_plot_data();
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
        console.log(unit);
        if (unit != null) {
            for (const u of unit.data) {
                if (!u.capacity_type) {
                    continue;
                }

                if (technologies[0] == u.technology) {
                    return u[0];
                }
            }
        }
        return "";
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
            selected_years.length == 0 ||
            selected_technologies.length == 0 ||
            data === null
        ) {
            filtered_data = null;
            return;
        }

        let dataset_selector: StringList = {};
        let datasets_aggregates: StringList = {};

        if (selected_aggregation == "technology") {
            dataset_selector["node"] = selected_locations;
            datasets_aggregates["technology"] = selected_technologies;
        } else {
            dataset_selector["technology"] = selected_technologies;
            datasets_aggregates["node"] = selected_locations;
        }

        let excluded_years = years.filter(
            (year) => !selected_years.includes(year),
        );

        filtered_data = filter_and_aggregate_data(
            data.data,
            dataset_selector,
            datasets_aggregates,
            excluded_years,
            false,
            selected_plot == "Line" ? "line" : "bar",
        );

        config.data = { datasets: filtered_data };

        // @ts-ignore
        config.options.scales.y.title.text =
            selected_variable + " [" + get_unit() + "]";

        config.options.scales.y.stacked = selected_plot != "Line";

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
        <h2>Energy Balance Storage</h2>
    </div>
</div>
<div class="row" style="z-index: 1; position: relative;">
    <div class="col position-relative">
        <div class="filters" style="position: absolute; width: 100%;">
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
                                bind:years
                                bind:selected_solution
                                bind:loading={solution_loading}
                                on:solution_selected={() => {
                                    solution_changed();
                                }}
                                enabled={!fetching && !solution_loading}
                            />
                        </div>
                    </div>
                </div>
                {#if !solution_loading && selected_solution}
                    <div class="accordion-item variable-selection">
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
                                <h3>Variable</h3>
                                <select
                                    bind:value={selected_variable}
                                    on:change={(e) => {
                                        variable_changed();
                                    }}
                                    disabled={fetching || solution_loading}
                                >
                                    {#each variables as variable}
                                        <option value={variable}>
                                            {variable}
                                        </option>
                                    {/each}
                                </select>

                                {#if carriers.length > 0}
                                    <h3>Carrier</h3>
                                    <select
                                        bind:value={selected_carrier}
                                        on:change={() => {
                                            carrier_changed();
                                        }}
                                        disabled={fetching || solution_loading}
                                    >
                                        {#each carriers as carrier}
                                            <option value={carrier}>
                                                {carrier}
                                            </option>
                                        {/each}
                                        disabled={fetching || solution_loading}
                                    </select>
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
                                    <div class="row">
                                        <div class="col-6">
                                            <h3>Aggregation</h3>
                                            <Radio
                                                bind:options={aggregation_options}
                                                bind:selected_option={selected_aggregation}
                                                on:selection-changed={(e) => {
                                                    console.log(
                                                        "Aggregation changed",
                                                    );
                                                    update_plot_data();
                                                }}
                                            ></Radio>
                                        </div>
                                        <div class="col-6">
                                            <h3>Plot Style</h3>
                                            <Radio
                                                bind:options={plot_options}
                                                bind:selected_option={selected_plot}
                                                on:selection-changed={(e) => {
                                                    update_plot_data();
                                                }}
                                            ></Radio>
                                        </div>
                                    </div>
                                    {#if selected_aggregation == "technology"}
                                        <h3>Technology</h3>
                                        <AllCheckbox
                                            bind:selected_elements={selected_technologies}
                                            bind:elements={technologies}
                                            on:selection-changed={() => {
                                                console.log(
                                                    "Technology changed",
                                                );
                                                update_plot_data();
                                            }}
                                        ></AllCheckbox>
                                    {:else}
                                        <h3>Node</h3>
                                        <AllCheckbox
                                            bind:selected_elements={selected_locations}
                                            bind:elements={locations}
                                            on:selection-changed={(e) => {
                                                console.log("Node changed");
                                                update_plot_data();
                                            }}
                                        ></AllCheckbox>
                                    {/if}

                                    <h3>Year</h3>
                                    <AllCheckbox
                                        bind:selected_elements={selected_years}
                                        bind:elements={years}
                                        on:selection-changed={(e) => {
                                            console.log("Year changed");
                                            update_plot_data();
                                        }}
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
<div class="col" style="margin-top: 400px;">
    <div class="row">
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
            <BarPlot bind:config bind:plot_name></BarPlot>
        {/if}
    </div>
</div>
