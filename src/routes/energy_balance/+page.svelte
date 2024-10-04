<script lang="ts">
    import SolutionFilter from "../../components/SolutionFilter.svelte";
    import type { ActivatedSolution } from "$lib/types";
    import Dropdown from "../../components/Dropdown.svelte";
    import { get_energy_balance, get_unit } from "$lib/temple";
    import BarPlot from "../../components/plots/BarPlot.svelte";
    import { filter_and_aggregate_data } from "$lib/utils";
    import { tick } from "svelte";

    var defaultColors = [
        "rgb(75, 192, 192)",
        "rgb(54, 162, 235)",
        "rgb(255, 206, 86)",
        "rgb(153, 102, 255)",
        "rgb(255, 159, 64)",
        "rgb(255, 99, 132)",
        "rgb(201, 203, 207)",
        "rgb(220,20,60)",
        "rgb(255,99,71)",
        "rgb(255,69,0)",
        "rgb(154,205,50)",
        "rgb(0,100,0)",
        "rgb(50,205,50)",
        "rgb(0,139,139)",
        "rgb(153,50,204)",
        "rgb(255,105,180)",
    ];

    let selected_solution: ActivatedSolution | null = null;
    let plot_ready = false;
    let solution_loading: boolean = false;
    let fetching = false;

    let nodes: string[] = [];
    let selected_node: string | null = null;

    let carriers: string[] = [];
    let selected_carrier: string | null = null;

    let years: number[] = [];
    let selected_year: number | null = null;

    interface StringList {
        [key: string]: string[];
    }

    const initial_config = {
        counter: 1,
        type: "line",
        data: { datasets: [] as any[] },
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
                    stacked: true,
                    title: {
                        display: true,
                        text: "Power",
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
                    },
                    zoom: {
                        drag: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: "x",
                    },
                },
            },
        },
    };

    let config = structuredClone(initial_config);

    async function solution_changed() {
        if (!selected_solution) {
            return;
        }
        config = structuredClone(initial_config);

        selected_node = nodes[0];
        selected_carrier = carriers[0];
        selected_year = years[0];
        plot_ready = false;

        await data_changed();
        return;
    }

    async function data_changed() {
        fetching = true;
        tick();
        if (
            selected_node == null ||
            selected_carrier == null ||
            selected_year == null ||
            selected_solution == null
        ) {
            fetching = false;
            return;
        }
        let year_index = Math.floor(
            (selected_year - selected_solution.detail.system.reference_year) /
                selected_solution.detail.system.interval_between_years,
        );

        console.log("Getting energy balance.");
        let a = await get_energy_balance(
            selected_solution.solution_name,
            selected_node,
            selected_carrier,
            selected_solution.scenario_name,
            year_index,
        );

        let unit = await get_unit(
            selected_solution.solution_name,
            "flow_export",
            selected_solution.scenario_name,
        );

        let datasets = [];
        let i = 0;
        console.log(a)
        for (const plot_name in a) {
            let dataset_selector: StringList = {
                node: [selected_node!],
            };

            if (a[plot_name] == undefined || a[plot_name].data.length == 0) {
                continue;
            }

            if ("technology" in a[plot_name].data[0]) {
                let technologies = [];
                for (const row of a[plot_name].data) {
                    technologies.push(row["technology"]);
                }
                dataset_selector = {
                    technology: technologies,
                };
            }
            let datasets_aggregates: StringList = {};

            let current_plots = filter_and_aggregate_data(
                a[plot_name].data,
                dataset_selector,
                datasets_aggregates,
            );
            if (current_plots.length == 0) {
                continue;
            }

            for (let current_plot of current_plots) {
                if (Object.keys(current_plot.data).length == 0) {
                    continue;
                }

                switch (plot_name) {
                    case "flow_storage_discharge":
                        current_plot.label =
                            current_plot.label + " (discharge)";
                        break;
                    case "flow_transport_in":
                        current_plot.label =
                            current_plot.label + " (transport in)";
                        break;
                    case "flow_import":
                        current_plot.label = "Import";
                        break;
                    case "shed_demand":
                        current_plot.label = "Shed Demand";
                        break;
                    case "flow_storage_charge":
                        current_plot.label = current_plot.label + " (charge)";
                        break;
                    case "flow_transport_out":
                        current_plot.label =
                            current_plot.label + " (transport out)";
                        break;
                    case "flow_export":
                        current_plot.label = "Export";
                        break;
                    default:
                        break;
                }

                let plot_type = "line";

                if (Object.keys(current_plot.data).length == 1) {
                    plot_type = "bar";
                }

                if (plot_name == "demand") {
                    current_plot.label = "Demand";
                    current_plot.type = "line";
                    current_plot.stack = "ownCustomStack";
                    current_plot.fill = false;
                    current_plot.borderColor = "black";
                    current_plot.backgroundColor = "white";
                    current_plot.borderWidth = 2;
                    current_plot.stepped = true;
                    if (Object.keys(current_plot.data).length == 1) {
                        current_plot.pointRadius = 2;
                    }
                } else {
                    current_plot.type = plot_type;
                    current_plot.fill = "origin";
                    current_plot.borderColor =
                        defaultColors[i % defaultColors.length];
                    current_plot.backgroundColor = defaultColors[
                        i % defaultColors.length
                    ]!.replace(")", ", 1)");
                    current_plot.stepped = true;
                    current_plot.cubicInterpolationMode = "monotone";
                }
                datasets.push(current_plot);

                i++;
            }
        }
        config.data.labels = Object.keys(datasets[0].data);
        config.data.datasets = datasets;
        config.options.scales.y.title.text = "Power [" + unit + "]";

        fetching = false;
        plot_ready = true;
        let start = performance.now();
        await tick();
        console.log("Building plot took", performance.now() - start);
    }
</script>

<div class="row">
    <div class="col">
        <h2>The Energy Balance</h2>
    </div>
</div>
<div class="row">
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
                                on:solution_selected={solution_changed}
                                bind:carriers
                                bind:nodes
                                bind:years
                                bind:selected_solution
                                bind:loading={solution_loading}
                                enabled={!solution_loading && !fetching}
                            />
                        </div>
                    </div>
                </div>
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseTwo"
                            aria-expanded="false"
                            aria-controls="collapseTwo"
                        >
                            Data selection
                        </button>
                    </h2>
                    <div
                        id="collapseTwo"
                        class="accordion-collapse collapse"
                        data-bs-parent="#accordionExample"
                    >
                        <div class="accordion-body">
                            <div class="row">
                                <div class="col-6">
                                    <h3>Year</h3>
                                    <Dropdown
                                        bind:options={years}
                                        bind:selected_option={selected_year}
                                        on:selection-changed={data_changed}
                                        enabled={!fetching && !solution_loading}
                                    ></Dropdown>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <h3>Node</h3>
                                    <Dropdown
                                        bind:options={nodes}
                                        bind:selected_option={selected_node}
                                        on:selection-changed={data_changed}
                                        enabled={!fetching && !solution_loading}
                                    ></Dropdown>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <h3>Carrier</h3>
                                    <Dropdown
                                        bind:options={carriers}
                                        bind:selected_option={selected_carrier}
                                        on:selection-changed={data_changed}
                                        enabled={!fetching && !solution_loading}
                                    ></Dropdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col" style="margin-top: 400px;">
        {#if fetching}
            <div class="text-center">
                <div class="spinner-border center" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        {/if}
        {#if !fetching && plot_ready}
            <div style="position: relative;">
                <BarPlot zoom={true} bind:config></BarPlot>
            </div>
        {/if}
    </div>
</div>

<style>
    .hidden {
        opacity: 0;
    }
</style>
