<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import Radio from "../../../components/Radio.svelte";
	import { get_component_total, get_solution_detail } from "$lib/temple";
	import { filter_and_aggregate_data, group_data } from "$lib/utils";
	import { tick } from "svelte";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

	let data: Papa.ParseResult<any> | null;
	let limit_data: Papa.ParseResult<any> | null;
	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let locations: string[] = [];
	let variables: string[] = ["Annual", "Cumulative"];
	let groupings: string[] = ["technology", "carrier"];
	let selected_solution: ActivatedSolution | null = null;
	let selected_years: number[] = [];
	let normalisation_options = ["not_normalized", "normalized"];
	let selected_normalisation: string = "not_normalized";
	let aggregation_options: string[] = [];
	let selected_locations: string[] = [];
	let unit: Papa.ParseResult<any> | null = null;
	let filtered_data: any[] | null = null;
	let selected_variable: string | null = null;
	let selected_grouping: string | null = null;
	let subdivision: boolean = false;
	let selected_carriers: string[] = [];
	let selected_technologies: string[] = [];
	let selected_aggregation: string = "technology";
	let technologies: string[] = [];
	let solution_loading: boolean = false;
	let fetching: boolean = false;
	let plot_name = "plot";

	interface StringList {
		[key: string]: string[];
	}

	let config = {
		type: "bar",
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
						text: "Emissions [" + get_unit() + "]",
					},
				},
			},
		},
	};

	function get_unit() {
		return unit?.data[0][0];
	}

	function reset_subsection() {
		selected_variable = null;
		selected_grouping = null;
		filtered_data = null;
		subdivision = false;
		selected_carriers = [];
		selected_technologies = [];
	}

	function get_variable_name() {
		if (subdivision) {
			if (selected_grouping == groupings[0]) {
				return "carbon_emissions_technology";
			} else {
				return "carbon_emissions_carrier";
			}
		} else {
			if (selected_variable == variables[0]) {
				return "carbon_emissions_annual";
			} else {
				return "carbon_emissions_cumulative";
			}
		}
	}

	async function fetch_subdivision_data() {
		fetching = true;

		let carbon_emissions_technology = await get_component_total(
			selected_solution!.solution_name,
			"carbon_emissions_technology",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		let carbon_emissions_carrier = await get_component_total(
			selected_solution!.solution_name,
			"carbon_emissions_carrier",
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		let set_carriers = new Set<string>();
		let set_technologies = new Set<string>();
		let set_locations = new Set<string>();

		for (let i of carbon_emissions_technology.data!.data) {
			set_technologies.add(i.technology);
			set_locations.add(i.location);
		}

		for (let i of carbon_emissions_carrier.data!.data) {
			set_carriers.add(i.carrier);
			set_locations.add(i.node);

			if (Object.hasOwn(i, "node")) {
				let location = Object.getOwnPropertyDescriptor(i, "node");

				if (location === undefined) {
					continue;
				}

				Object.defineProperty(i, "location", location);
			}

			delete i["node"];
		}

		technologies = [...set_technologies];
		carriers = [...set_carriers];
		locations = [...set_locations];

		data = group_data("technology_carrier", [
			["carrier", carbon_emissions_carrier.data!],
			["technology", carbon_emissions_technology.data!],
		]);

		unit = carbon_emissions_carrier.unit;
		fetching = false;
		update_filters();
	}

	async function fetch_data() {
		fetching = true;
		await tick();

		let variable_name = get_variable_name();
		if (variable_name === null) {
			return;
		}

		if (variable_name == "carbon_emissions_annual") {
			let res = await get_component_total(
				selected_solution!.solution_name,
				"carbon_emissions_annual_limit",
				selected_solution!.scenario_name,
				selected_solution!.detail.system.reference_year,
				selected_solution!.detail.system.interval_between_years,
			);
			limit_data = res.data;
		} else {
			limit_data = null;
		}

		get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		).then((fetched) => {
			data = fetched.data;
			unit = fetched.unit;
			fetching = false;
		});
	}

	function update_filters() {
		aggregation_options = ["location"];

		if (selected_grouping) {
			aggregation_options = ["location", selected_grouping];
		}

		selected_carriers = carriers;
		selected_technologies = technologies;
		selected_locations = locations;
		selected_aggregation = "location";

		fetching = false;
		update_data();
	}

	function update_data() {
		if (!data) {
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (subdivision) {
			if (selected_aggregation != "location") {
				dataset_selector["location"] = locations;
				datasets_aggregates["technology_carrier"] =
					selected_technologies.concat(selected_carriers);
			} else {
				dataset_selector["technology_carrier"] =
					technologies.concat(carriers);
				datasets_aggregates["location"] = selected_locations;
			}
		}

		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == "normalized",
		);

		if (filtered_data.length == 0) {
			return;
		}

		if (filtered_data.length == 1 && !subdivision) {
			filtered_data[0].label = get_variable_name();
		}

		if (limit_data) {
			let filtered_limit_data = filter_and_aggregate_data(
				limit_data.data,
				dataset_selector,
				datasets_aggregates,
				excluded_years,
				selected_normalisation == "normalized",
			);

			if (filtered_limit_data.length > 0) {
				filtered_limit_data[0].label = "Annual Emissions Limit";
				filtered_limit_data[0].type = "line";
				filtered_data = filtered_data.concat(filtered_limit_data);
			}
		}

		config.data = { datasets: filtered_data };

		config.options.scales.y.title.text = "Emissions [" + get_unit() + "]";

		let solution_names = selected_solution!.solution_name.split(".");
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			get_variable_name(),
		].join("_");
	}

	function solution_changed() {
		reset_subsection();
		selected_years = years;
	}
</script>

<h2>Emissions</h2>

<div class="row">
	<div class="col position-relative" style="z-index: 1; position: relative;">
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
				{#if !solution_loading && selected_solution}
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
								<h3>Subdivision</h3>
								<input
									type="checkbox"
									class="btn-check"
									id="btn-check-outlined"
									autocomplete="off"
									bind:checked={subdivision}
									on:change={() => {
										if (!subdivision) {
											reset_subsection();
										} else {
											selected_grouping =
												"technology_carrier";
											fetch_subdivision_data();
										}
									}}
									disabled={fetching || solution_loading}
								/>
								<label
									class="btn btn-outline-primary"
									for="btn-check-outlined"
									>{subdivision ? "on" : "off"}</label
								><br />
								{#if !subdivision}
									<div class="row">
										<h3>Cumulation</h3>
										<Radio
											bind:options={variables}
											bind:selected_option={selected_variable}
											on:selection-changed={fetch_data}
											enabled={!fetching &&
												!solution_loading}
										></Radio>
									</div>
								{/if}
							</div>
						</div>
					</div>
					{#if !fetching && (selected_variable || selected_grouping)}
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
									{#if subdivision}
										<div class="row">
											<div class="col-6">
												<h3>Aggregation</h3>
												<Radio
													bind:options={aggregation_options}
													bind:selected_option={selected_aggregation}
													on:selection-changed={(
														e,
													) => {
														update_data();
													}}
												></Radio>
											</div>
											<div class="col-6">
												<h3>Normalisation</h3>
												<Radio
													bind:options={normalisation_options}
													bind:selected_option={selected_normalisation}
													on:selection-changed={(
														e,
													) => {
														update_data();
													}}
												></Radio>
											</div>
										</div>
										{#if selected_aggregation != "location"}
											{#if technologies.length > 0}
												<h3>Technology</h3>
												<AllCheckbox
													bind:selected_elements={selected_technologies}
													bind:elements={technologies}
													on:selection-changed={() => {
														update_data();
													}}
												></AllCheckbox>
											{/if}
											{#if carriers.length > 0}
												<h3>Carrier</h3>
												<AllCheckbox
													bind:selected_elements={selected_carriers}
													bind:elements={carriers}
													on:selection-changed={(
														e,
													) => {
														update_data();
													}}
												></AllCheckbox>
											{/if}
										{:else}
											<h3>Location</h3>
											<AllCheckbox
												bind:selected_elements={selected_locations}
												bind:elements={locations}
												on:selection-changed={(e) => {
													update_data();
												}}
											></AllCheckbox>
										{/if}
									{/if}
									<h3>Year</h3>
									<AllCheckbox
										on:selection-changed={(e) => {
											update_data();
										}}
										bind:selected_elements={selected_years}
										bind:elements={years}
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
<div class="row">
	<div class="col" style="margin-top: 400px;">
		{#if solution_loading || fetching}
			<div class="text-center">
				<div class="spinner-border center" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		{:else if filtered_data != null && selected_solution != null}
			{#if filtered_data.length == 0 || filtered_data[0].data.length == 0}
				<div class="text-center">No data with this selection.</div>
			{:else}
				<BarPlot bind:config bind:plot_name></BarPlot>
			{/if}
		{/if}
	</div>
</div>
