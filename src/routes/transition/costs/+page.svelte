<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type {
		ActivatedSolution,
		ComponentTotal,
		Dataset,
	} from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import Radio from "../../../components/Radio.svelte";
	import ToggleButton from "../../../components/ToggleButton.svelte";

	import { get_component_total } from "$lib/temple";
	import {
		filter_and_aggregate_data,
		group_data,
		rename_field,
	} from "$lib/utils";
	import { tick } from "svelte";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let locations: string[] = [];
	let selected_locations: string[] = [];
	let selected_solution: ActivatedSolution | null = null;
	let current_unit: string = "";
	let selected_years: number[] = [];
	let selected_normalisation: string = "not_normalized";
	let selected_variable: string | null = null;
	let selected_cost_carriers: string[] = [];
	let selected_demand_carriers: string[] = [];
	let solution_loading: boolean = false;
	let fetching: boolean = false;
	let transport_technologies: string[] = [];
	let selected_transport_technologies: string[] = [];
	let storage_technologies: string[] = [];
	let selected_storage_technologies: string[] = [];
	let conversion_technologies: string[] = [];
	let selected_conversion_technologies: string[] = [];
	let grouped_data: Papa.ParseResult<any> | undefined;
	let fetched_cost_carbon: ComponentTotal;
	let fetched_cost_carrier: ComponentTotal;
	let fetched_capex: ComponentTotal;
	let fetched_opex: ComponentTotal;
	let fetched_cost_shed_demand: ComponentTotal;
	let cost_carriers: string[] = [];
	let demand_carriers: string[] = [];
	let combined_name = "Techology / Carrier";
	let aggregation_options: string[] = [combined_name, "Location"];
	let selected_aggregation: string = aggregation_options[1];
	let show_costs = {
		capex: { title: "Capex", show: true, subdivision: false },
		opex: { title: "Opex", show: true, subdivision: false },
		carrier: { title: "Carrier", show: true, subdivision: false },
		shed_demand: { title: "Shed Demand", show: true, subdivision: false },
		carbon_emission: {
			title: "Carbon Emissions",
			show: true,
			subdivision: false,
		},
	};
	const capex_suffix = " (Capex)";
	const opex_suffix = " (Opex)";
	const capex_label = "Capex";
	const opex_label = "Opex";
	const carrier_label = "Carrier";
	const shed_demand_label = "Shed Demand";

	interface StringList {
		[key: string]: string[];
	}

	let config = {
		type: "line",
		data: { datasets: [] as any[] },
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
						text: selected_variable + " [" + current_unit + "]",
					},
				},
			},
		},
	};

	async function fetch_data() {
		if (selected_solution == null) {
			return;
		}
		fetching = true;
		await tick();

		fetched_capex = await get_component_total(
			selected_solution!.solution_name,
			"capex_yearly",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		fetched_opex = await get_component_total(
			selected_solution!.solution_name,
			"opex_yearly",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		fetched_cost_carbon = await get_component_total(
			selected_solution!.solution_name,
			"cost_carbon_emissions_total",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		fetched_cost_carrier = await get_component_total(
			selected_solution!.solution_name,
			"cost_carrier",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		fetched_cost_shed_demand = await get_component_total(
			selected_solution!.solution_name,
			"shed_demand",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);
 
		rename_field(fetched_cost_carrier.data, "node", "location");
		rename_field(fetched_cost_shed_demand.data, "node", "location");

		rename_field(fetched_opex.data, "technology", combined_name);
		rename_field(fetched_capex.data, "technology", combined_name);
		rename_field(fetched_cost_carrier.data, "carrier", combined_name);
		rename_field(fetched_cost_shed_demand.data, "carrier", combined_name);

		// Add Capex / Opex suffix
		for (let i in fetched_capex.data.data) {
			fetched_capex.data.data[i][combined_name] =
				fetched_capex.data.data[i][combined_name] + capex_suffix;
		}
		for (let i in fetched_opex.data.data) {
			fetched_opex.data.data[i][combined_name] =
				fetched_opex.data.data[i][combined_name] + opex_suffix;
		}
		locations = Object.keys(selected_solution!.detail.edges).concat(
			selected_solution!.detail.system.set_nodes,
		);

		fetching = false;
	}

	function regroup_data(all_selected_carriers_technologies) {
		fetching = true;
		grouped_data = { data: [] };

		let filtered_cost_carrier = structuredClone(fetched_cost_carrier.data);

		filtered_cost_carrier.data = filtered_cost_carrier.data.filter((i) =>
			selected_cost_carriers.includes(i[combined_name]),
		);

		let filtered_fetched_cost_shed_demand = structuredClone(
			fetched_cost_shed_demand.data,
		);

		filtered_fetched_cost_shed_demand.data =
			filtered_fetched_cost_shed_demand.data.filter((i) =>
				selected_demand_carriers.includes(i[combined_name]),
			);

		if (show_costs.capex.show) {
			if (show_costs.capex.subdivision) {
				grouped_data.data = grouped_data.data.concat(
					fetched_capex.data.data,
				);
			} else {
				let comb = {};
				comb[combined_name] = all_selected_carriers_technologies;

				let new_data = filter_and_aggregate_data(
					fetched_capex.data.data,
					{ location: selected_locations },
					comb,
					[],
					false,
				);
				for (let i in new_data) {
					new_data[i].data["location"] = new_data[i].label;
					new_data[i].data[combined_name] = capex_label;
					grouped_data.data.push(new_data[i].data);
				}
			}
		}

		if (show_costs.opex.show) {
			if (show_costs.opex.subdivision) {
				grouped_data.data = grouped_data.data.concat(
					fetched_opex.data.data,
				);
			} else {
				let comb = {};
				comb[combined_name] = all_selected_carriers_technologies;

				let new_data = filter_and_aggregate_data(
					fetched_opex.data.data,
					{ location: selected_locations },
					comb,
					[],
					false,
				);
				for (let i in new_data) {
					new_data[i].data["location"] = new_data[i].label;
					new_data[i].data[combined_name] = opex_label;
					grouped_data.data.push(new_data[i].data);
				}
			}
		}

		if (show_costs.carrier.show) {
			if (show_costs.carrier.subdivision) {
				grouped_data.data = grouped_data.data.concat(
					filtered_cost_carrier.data,
				);
			} else {
				let comb = {};
				comb[combined_name] = all_selected_carriers_technologies;

				let new_data = filter_and_aggregate_data(
					filtered_cost_carrier.data,
					{ location: selected_locations },
					comb,
					[],
					false,
				);

				for (let i in new_data) {
					new_data[i].data["location"] = new_data[i].label;
					new_data[i].data[combined_name] = carrier_label;
					grouped_data.data.push(new_data[i].data);
				}
			}
		}

		if (show_costs.shed_demand.show) {
			if (show_costs.shed_demand.subdivision) {
				grouped_data.data = grouped_data.data.concat(
					filtered_fetched_cost_shed_demand.data,
				);
			} else {
				let comb = {};
				comb[combined_name] = all_selected_carriers_technologies;

				let new_data = filter_and_aggregate_data(
					filtered_fetched_cost_shed_demand.data,
					{ location: selected_locations },
					comb,
					[],
					false,
				);
				for (let i in new_data) {
					new_data[i].data["location"] = new_data[i].label;
					new_data[i].data[combined_name] = shed_demand_label;
					grouped_data.data.push(new_data[i].data);
				}
			}
		}

		if (grouped_data.data.length == 0) {
			grouped_data = undefined;
			fetching = false;
			return;
		}
		let set_locations = new Set<string>();

		grouped_data.data = grouped_data.data.filter((e) => {
			return e != undefined;
		});

		for (const i of grouped_data.data) {
			set_locations.add(i["location"]);
		}
		locations = Array.from(set_locations);
		fetching = false;
	}

	function update_data() {
		fetching = true;
		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		// Select all technologies and carriers
		let suffixed_technologies = [];
		for (const i of selected_conversion_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		for (const i of selected_storage_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		for (const i of selected_transport_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		let all_selected_carriers_technologies = [
			...suffixed_technologies,
			...selected_cost_carriers,
			...selected_demand_carriers,
		];

		regroup_data(all_selected_carriers_technologies);

		if (!show_costs.capex.subdivision) {
			all_selected_carriers_technologies.push(capex_label);
		}

		if (!show_costs.opex.subdivision) {
			all_selected_carriers_technologies.push(opex_label);
		}

		if (!show_costs.carrier.subdivision) {
			all_selected_carriers_technologies.push(carrier_label);
		}

		if (!show_costs.shed_demand.subdivision) {
			all_selected_carriers_technologies.push(shed_demand_label);
		}

		// Specify Aggregation
		if (selected_aggregation == aggregation_options[0]) {
			dataset_selector["location"] = locations;
			datasets_aggregates[combined_name] =
				all_selected_carriers_technologies;
		} else {
			dataset_selector[combined_name] =
				all_selected_carriers_technologies;
			datasets_aggregates["location"] = selected_locations;
		}

		// Define excluded years
		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		let normalized = selected_normalisation == "normalized";
		let filtered_data: Dataset[] = [];

		// Get Plot-Data
		if (grouped_data) {
			filtered_data = filter_and_aggregate_data(
				grouped_data.data,
				dataset_selector,
				datasets_aggregates,
				excluded_years,
				normalized,
			);
		}

		// Get Total Carbon Cost Data
		if (
			fetched_cost_carbon.data.data.length > 0 &&
			show_costs.carbon_emission.show
		) {
			filtered_data.push({
				label: "Total Carbon Costs",
				data: fetched_cost_carbon.data.data[0],
				type: "bar",
			});
		}

		tick().then(() => {
			config.data = { datasets: filtered_data };

			config.options.scales.y.title.text =
				selected_variable + " [" + current_unit + "]";

			fetching = false;
		});
	}

	async function solution_changed() {
		if (selected_solution == null) {
			return;
		}
		await fetch_data();
		await tick();
		fetching = true;

		// Options for Capex / Opex
		let set_capex_opex_technologies = new Set<string>();

		for (const row of fetched_capex.data.data) {
			set_capex_opex_technologies.add(
				row[combined_name].replace(capex_suffix, ""),
			);
		}
		for (const row of fetched_opex.data.data) {
			set_capex_opex_technologies.add(
				row[combined_name].replace(opex_suffix, ""),
			);
		}

		transport_technologies =
			selected_solution!.detail.system.set_transport_technologies.filter(
				(t) => set_capex_opex_technologies.has(t),
			);
		conversion_technologies =
			selected_solution!.detail.system.set_conversion_technologies.filter(
				(t) => set_capex_opex_technologies.has(t),
			);
		storage_technologies =
			selected_solution!.detail.system.set_storage_technologies.filter(
				(t) => set_capex_opex_technologies.has(t),
			);

		selected_transport_technologies = transport_technologies;
		selected_conversion_technologies = conversion_technologies;
		selected_storage_technologies = storage_technologies;

		// Options for Cost Carriers
		let set_cost_carriers = new Set<string>();

		for (const row of fetched_cost_carrier.data.data) {
			set_cost_carriers.add(row[combined_name]);
		}

		carriers = selected_solution!.detail.system.set_carriers;
		cost_carriers = selected_solution!.detail.carriers_import
			.concat(selected_solution!.detail.carriers_export)
			.filter((i) => set_cost_carriers.has(i));

		selected_cost_carriers = cost_carriers;

		// Options for Demand Carriers
		let set_demand_carriers = new Set<string>();
		for (const row of fetched_cost_shed_demand.data.data) {
			set_demand_carriers.add(row[combined_name]);
		}
		demand_carriers = selected_solution!.detail.carriers_demand.filter(
			(i) => set_demand_carriers.has(i),
		);

		selected_demand_carriers = demand_carriers;
		nodes = selected_solution!.detail.system.set_nodes;

		// Set years
		selected_years = years;

		// Set locations
		selected_locations = locations;

		update_data();
		fetching = false;
	}
</script>

<h2>Costs</h2>

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
				{#if !fetching && !solution_loading && fetched_capex && selected_solution != null}
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button collapsed"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapseCost"
								aria-expanded="false"
								aria-controls="collapseCost"
							>
								Cost selection
							</button>
						</h2>
						<div
							id="collapseCost"
							class="accordion-collapse collapse"
							data-bs-parent="#accordionExample"
						>
							<div class="accordion-body">
								{#each Object.keys(show_costs) as key}
									<div class="d-flex">
										<h4>{show_costs[key].title} :</h4>
										<ToggleButton
											bind:value={show_costs[key].show}
											on:change={update_data}
										></ToggleButton>

										{#if show_costs[key].show && key != "carbon_emission"}
											Subdivision
											<ToggleButton
												bind:value={show_costs[key]
													.subdivision}
												on:change={update_data}
											></ToggleButton>
										{/if}
									</div>
								{/each}
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
								Technology and Carrier Selection
							</button>
						</h2>
						<div
							id="collapseTwo"
							class="accordion-collapse collapse"
							data-bs-parent="#accordionExample"
						>
							<div class="accordion-body">
								<h3>Technologies (for Capex/Opex)</h3>
								{#if transport_technologies.length > 0}
									<h4>Transport</h4>
									<AllCheckbox
										bind:selected_elements={selected_transport_technologies}
										bind:elements={transport_technologies}
										on:selection-changed={() => {
											update_data();
										}}
									></AllCheckbox>
								{/if}
								{#if storage_technologies.length > 0}
									<h4>Storage</h4>
									<AllCheckbox
										bind:selected_elements={selected_storage_technologies}
										bind:elements={storage_technologies}
										on:selection-changed={() => {
											update_data();
										}}
									></AllCheckbox>
								{/if}
								{#if conversion_technologies.length > 0}
									<h4>Conversion</h4>
									<AllCheckbox
										bind:selected_elements={selected_conversion_technologies}
										bind:elements={conversion_technologies}
										on:selection-changed={() => {
											update_data();
										}}
									></AllCheckbox>
								{/if}
								{#if cost_carriers.length > 0}
									<h3>Cost of Carrier</h3>
									<AllCheckbox
										bind:selected_elements={selected_cost_carriers}
										bind:elements={cost_carriers}
										on:selection-changed={() => {
											update_data();
										}}
									></AllCheckbox>
								{/if}
								{#if demand_carriers.length > 0}
									<h3>Shed Demand</h3>
									<AllCheckbox
										bind:selected_elements={selected_demand_carriers}
										bind:elements={demand_carriers}
										on:selection-changed={() => {
											update_data();
										}}
									></AllCheckbox>
								{/if}
							</div>
						</div>
					</div>
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
								<div class="accordion-body">
									<div class="row">
										<div class="col-6">
											<h3>Aggregation</h3>
											<Radio
												bind:options={aggregation_options}
												bind:selected_option={selected_aggregation}
												on:selection-changed={(e) => {
													update_data();
												}}
											></Radio>
										</div>
									</div>
									{#if selected_aggregation == aggregation_options[1]}
										<h3>Location</h3>
										<AllCheckbox
											bind:selected_elements={selected_locations}
											elements={locations}
											on:selection-changed={(e) => {
												update_data();
											}}
										></AllCheckbox>
									{/if}
									{#if selected_years}
										<h3>Year</h3>
										<AllCheckbox
											bind:selected_elements={selected_years}
											elements={years}
											on:selection-changed={(e) => {
												update_data();
											}}
										></AllCheckbox>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
<div class="row">
	<div class="col" style="margin-top: 400px;">
		{#if solution_loading || fetching}
			<div class="text-center">
				<div class="spinner-border center" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		{:else if selected_solution != null}
			{#if config.data.datasets.length == 0 || config.data.datasets[0].data.length == 0}
				<div class="text-center">No data with this selection.</div>
			{:else}
				<BarPlot
					bind:config
					bind:year_offset={selected_solution.detail.system
						.reference_year}
				></BarPlot>
			{/if}
		{/if}
	</div>
</div>
