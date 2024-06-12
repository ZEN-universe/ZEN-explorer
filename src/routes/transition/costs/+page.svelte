<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type {
		ActivatedSolution,
		ComponentTotal,
		Dataset,
	} from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import { get_component_total } from "$lib/temple";
	import { filter_and_aggregate_data } from "$lib/utils";
	import { tick } from "svelte";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

	let carriers: string[] = [];
	let nodes: string[] = [];
	let selected_nodes: string[] = [];
	let years: number[] = [];
	let locations: string[] = [];
	let plots: string[] = ["capex", "opex", "cost_carbon_emissions"];
	let selected_solution: ActivatedSolution | null = null;
	let current_unit: string = "";
	let selected_years: number[] = [];
	let selected_normalisation: string = "not_normalized";
	let selected_variable: string | null = null;
	let selected_cost_carriers: string[] = [];
	let selected_demand_carriers: string[] = [];
	let selected_technologies: string[] = [];
	let technologies: string[] = [];
	let solution_loading: boolean = false;
	let fetching: boolean = false;
	let transport_technologies: string[] = [];
	let selected_transport_technologies: string[] = [];
	let storage_technologies: string[] = [];
	let selected_storage_technologies: string[] = [];
	let conversion_technologies: string[] = [];
	let selected_conversion_technologies: string[] = [];
	let selected_plots: string[] = plots;
	let fetched_cost_carbon: ComponentTotal;
	let fetched_cost_carrier: ComponentTotal;
	let fetched_capex: ComponentTotal;
	let fetched_opex: ComponentTotal;
	let fetched_cost_shed_demand: ComponentTotal;
	let cost_carriers: string[] = [];
	let demand_carriers: string[] = [];

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
		fetching = true;
		await tick();

		let variable_name = "";
		if (variable_name === null) {
			return;
		}

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
		fetching = false;
	}

	function update_data() {
		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};
		dataset_selector["node"] = locations;
		datasets_aggregates["technology"] = selected_technologies;

		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		let all_selected_technologies = [
			...selected_conversion_technologies,
			...selected_storage_technologies,
			...selected_transport_technologies,
		];

		let filtered_data: Dataset[] = [];
		let normalized = selected_normalisation == "normalized";

		// Add Cost Carriers
		if (selected_cost_carriers.length > 0) {
			let cost_carriers_data = filter_and_aggregate_data(
				fetched_cost_carrier.data.data,
				{},
				{ node: selected_nodes },
				excluded_years,
				normalized,
			);
			cost_carriers_data[0].label = "Cost of carrier";
			filtered_data = filtered_data.concat(cost_carriers_data);
		}

		if (selected_demand_carriers.length > 0) {
			let shed_demand_data = filter_and_aggregate_data(
				fetched_cost_shed_demand.data.data,
				{ node: selected_nodes },
				{ carrier: selected_demand_carriers },
				excluded_years,
				normalized,
				"line",
				" (Shed Demand)	",
			);
			filtered_data = filtered_data.concat(shed_demand_data);
		}

		if (technologies.length > 0) {
			if (selected_plots.includes("opex")) {
				let opex_data = filter_and_aggregate_data(
					fetched_opex.data.data,
					{ location: selected_nodes },
					{ technology: all_selected_technologies },
					excluded_years,
					normalized,
					"line",
					" (Opex)",
				);
				filtered_data = filtered_data.concat(opex_data);
			}
			if (selected_plots.includes("capex")) {
				let opex_data = filter_and_aggregate_data(
					fetched_capex.data.data,
					{ location: selected_nodes },
					{ technology: all_selected_technologies },
					excluded_years,
					normalized,
					"line",
					" (Capex)",
				);
				filtered_data = filtered_data.concat(opex_data);
			}
		}

		if (selected_plots.includes("cost_carbon_emissions")) {
			if (fetched_cost_carbon) {
				let carbon_data = filter_and_aggregate_data(
					fetched_cost_carbon.data.data,
					{},
					{},
					excluded_years,
					normalized,
					"line",
				);
				if (carbon_data.length > 0) {
					carbon_data[0].label = "Cost of Carbon Emissions";
					filtered_data = filtered_data.concat(carbon_data);
				}
			}
		}

		config.data = { datasets: filtered_data };

		config.options.scales.y.title.text =
			selected_variable + " [" + current_unit + "]";
	}

	async function solution_changed() {
		technologies = selected_solution!.detail.system.set_technologies;

		transport_technologies =
			selected_solution!.detail.system.set_transport_technologies;
		conversion_technologies =
			selected_solution!.detail.system.set_conversion_technologies;
		storage_technologies =
			selected_solution!.detail.system.set_storage_technologies;

		selected_transport_technologies = transport_technologies;
		selected_conversion_technologies = conversion_technologies;
		selected_storage_technologies = storage_technologies;

		carriers = selected_solution!.detail.system.set_carriers;
		cost_carriers = selected_solution!.detail.carriers_import.concat(
			selected_solution!.detail.carriers_export,
		);

		selected_cost_carriers = cost_carriers;
		demand_carriers = selected_solution!.detail.carriers_demand;
		selected_demand_carriers = demand_carriers;
		nodes = selected_solution!.detail.system.set_nodes;
		selected_nodes = nodes;
		selected_years = years;
		await tick();

		await fetch_data();
		update_data();
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
				{#if !fetching && !solution_loading && fetched_capex}
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
								<h4>Transport</h4>
								<AllCheckbox
									bind:selected_elements={selected_transport_technologies}
									bind:elements={transport_technologies}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
								<h4>Storage</h4>
								<AllCheckbox
									bind:selected_elements={selected_storage_technologies}
									bind:elements={storage_technologies}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
								<h4>Conversion</h4>
								<AllCheckbox
									bind:selected_elements={selected_conversion_technologies}
									bind:elements={conversion_technologies}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
								<h3>Cost of Carrier</h3>
								<AllCheckbox
									bind:selected_elements={selected_cost_carriers}
									bind:elements={cost_carriers}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
								<h3>Shed Demand</h3>
								<AllCheckbox
									bind:selected_elements={selected_demand_carriers}
									bind:elements={demand_carriers}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
								<h3>Plots</h3>
								<AllCheckbox
									bind:selected_elements={selected_plots}
									bind:elements={plots}
									on:selection-changed={() => {
										update_data();
									}}
								></AllCheckbox>
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
									<h3>Node</h3>
									<AllCheckbox
										bind:selected_elements={selected_nodes}
										bind:elements={nodes}
										on:selection-changed={(e) => {
											update_data();
										}}
									></AllCheckbox>

									<h3>Year</h3>
									<AllCheckbox
										bind:selected_elements={selected_years}
										bind:elements={years}
										on:selection-changed={(e) => {
											update_data();
										}}
									></AllCheckbox>
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
