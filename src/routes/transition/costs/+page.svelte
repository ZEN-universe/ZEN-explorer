<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type {
		ActivatedSolution,
		ComponentTotal,
		Dataset,
	} from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import Radio from "../../../components/Radio.svelte";

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
	let grouped_data: Papa.ParseResult<any>;
	let fetched_cost_carbon: ComponentTotal;
	let fetched_cost_carrier: ComponentTotal;
	let fetched_capex: ComponentTotal;
	let fetched_opex: ComponentTotal;
	let fetched_cost_shed_demand: ComponentTotal;
	let cost_carriers: string[] = [];
	let demand_carriers: string[] = [];
	let combined_name = "Techology / Carrier";
	let aggregation_options: string[] = [combined_name, "Location"];
	let selected_aggregation: string = aggregation_options[0];

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

		let variable_name = "";
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
		fetching = false;
	}

	function regroup_data() {
		fetching = true;

		let filtered_cost_carrier = structuredClone(fetched_cost_carrier.data);

		filtered_cost_carrier.data = filtered_cost_carrier.data.filter((i) =>
			selected_cost_carriers.includes(i["carrier"]),
		);

		let filtered_fetched_cost_shed_demand = structuredClone(
			fetched_cost_shed_demand.data,
		);

		filtered_fetched_cost_shed_demand.data =
			filtered_fetched_cost_shed_demand.data.filter((i) =>
				selected_demand_carriers.includes(i["carrier"]),
			);

		grouped_data = group_data(combined_name, [
			["technology", fetched_capex.data],
			["technology", fetched_opex.data],
			["carrier", filtered_cost_carrier],
			["carrier", filtered_fetched_cost_shed_demand],
		]);

		let set_locations = new Set<string>();
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
		regroup_data();

		// Select all technologies and carriers
		let all_selected_carriers_technologies = [
			...selected_conversion_technologies,
			...selected_storage_technologies,
			...selected_transport_technologies,
			...selected_cost_carriers,
			...selected_demand_carriers,
		];

		// Specify Aggregation
		if (selected_aggregation == aggregation_options[0]) {
			dataset_selector["location"] = locations;
			datasets_aggregates[combined_name] =
				all_selected_carriers_technologies;
		} else {
			dataset_selector[combined_name] =
				all_selected_carriers_technologies;
			datasets_aggregates["location"] = locations;
		}

		// Define excluded years
		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		let normalized = selected_normalisation == "normalized";

		// Get Plot-Data
		let filtered_data = filter_and_aggregate_data(
			grouped_data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			normalized,
		);

		// Get Total Carbon Cost Data
		if (fetched_cost_carbon.data.data.length > 0) {
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

		fetching = true;

		// Options for Capex / Opex
		let set_apex_opex_technologies = new Set<string>();
		for (const row of fetched_capex.data.data) {
			set_apex_opex_technologies.add(row[combined_name]);
		}
		for (const row of fetched_opex.data.data) {
			set_apex_opex_technologies.add(row[combined_name]);
		}

		transport_technologies =
			selected_solution!.detail.system.set_transport_technologies.filter(
				(t) => set_apex_opex_technologies.has(t),
			);
		conversion_technologies =
			selected_solution!.detail.system.set_conversion_technologies.filter(
				(t) => set_apex_opex_technologies.has(t),
			);
		storage_technologies =
			selected_solution!.detail.system.set_storage_technologies.filter(
				(t) => set_apex_opex_technologies.has(t),
			);

		selected_transport_technologies = transport_technologies;
		selected_conversion_technologies = conversion_technologies;
		selected_storage_technologies = storage_technologies;

		// Options for Cost Carriers
		let set_cost_carriers = new Set<string>();

		for (const row of fetched_cost_carrier.data.data) {
			set_cost_carriers.add(row["carrier"]);
		}

		carriers = selected_solution!.detail.system.set_carriers;
		cost_carriers = selected_solution!.detail.carriers_import
			.concat(selected_solution!.detail.carriers_export)
			.filter((i) => set_cost_carriers.has(i));

		selected_cost_carriers = cost_carriers;

		// Options for Demand Carriers
		let set_demand_carriers = new Set<string>();
		for (const row of fetched_cost_shed_demand.data.data) {
			set_demand_carriers.add(row["carrier"]);
		}
		demand_carriers = selected_solution!.detail.carriers_demand.filter(
			(i) => set_demand_carriers.has(i),
		);

		selected_demand_carriers = demand_carriers;
		nodes = selected_solution!.detail.system.set_nodes;

		// Set years
		selected_years = years;

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
