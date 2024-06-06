<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import Radio from "../../../components/Radio.svelte";
	import { get_component_total } from "$lib/temple";
	import { filter_and_aggregate_data } from "$lib/utils";
	import { tick } from "svelte";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

	let data: Papa.ParseResult<any>;
	let limit_data: Papa.ParseResult<any> | null;
	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let locations: string[] = [];
	let variables: string[] = ["Annual", "Cumulative"];
	let groupings: string[] = ["technology", "carrier"];
	let selected_solution: ActivatedSolution | null = null;
	let current_unit: string = "";
	let current_location: string = "";
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
						text: selected_variable + " [" + current_unit + "]",
					},
				},
			},
		},
	};

	function reset_subsection() {
		selected_variable = null;
		selected_grouping = null;
		filtered_data = null;
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

			let set_technologies = new Set<string>();
			let set_locations = new Set<string>();
			let set_carriers = new Set<string>();

			if (data.meta.fields?.includes("location")) {
				current_location = "location";
			} else {
				current_location = "node";
			}

			aggregation_options = [current_location];

			if (selected_grouping) {
				aggregation_options = [current_location, selected_grouping];
			}

			for (const d of data.data) {
				if (d.technology) {
					set_technologies.add(d.technology);
				}
				if (d[current_location]) {
					set_locations.add(d[current_location]);
				}
				if (d.carrier) {
					set_carriers.add(d.carrier);
				}
			}

			technologies = [...set_technologies];
			locations = [...set_locations];
			carriers = [...set_carriers];
			selected_carriers = carriers;
			selected_technologies = technologies;
			selected_locations = locations;
			selected_aggregation = current_location;

			fetching = false;
			update_data();
		});
	}

	function update_data() {
		if (!data) {
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (subdivision) {
			if (selected_grouping == "technology") {
				if (selected_aggregation != current_location) {
					dataset_selector[current_location] = locations;
					datasets_aggregates["technology"] = selected_technologies;
				} else {
					dataset_selector["technology"] = technologies;
					datasets_aggregates[current_location] = selected_locations;
				}
			} else {
				if (selected_aggregation != current_location) {
					dataset_selector[current_location] = locations;
					datasets_aggregates["carrier"] = selected_carriers;
				} else {
					dataset_selector["carrier"] = carriers;
					datasets_aggregates[current_location] = selected_locations;
				}
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

		if (filtered_data.length == 1) {
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

		config.options.scales.y.title.text =
			selected_variable + " [" + current_unit + "]";
	}

	function solution_changed() {
		reset_subsection();
		selected_years = years;
	}
</script>

<h2>Emissions</h2>

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
										reset_subsection();
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
								{:else}
									<div class="row">
										<h3>Variable</h3>
										<Radio
											bind:options={groupings}
											bind:selected_option={selected_grouping}
											enabled={!fetching &&
												!solution_loading}
											on:selection-changed={fetch_data}
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
										{#if selected_aggregation == "technology"}
											<h3>Technology</h3>
											<AllCheckbox
												bind:selected_elements={selected_technologies}
												bind:elements={technologies}
												on:selection-changed={() => {
													update_data();
												}}
											></AllCheckbox>
										{:else if selected_aggregation == "carrier"}
											<h3>Carrier</h3>
											<AllCheckbox
												bind:selected_elements={selected_carriers}
												bind:elements={carriers}
												on:selection-changed={(e) => {
													update_data();
												}}
											></AllCheckbox>
										{:else if selected_aggregation == current_location}
											<h3>{current_location}</h3>
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
				<BarPlot
					bind:config
					bind:year_offset={selected_solution.detail.system
						.reference_year}
				></BarPlot>
			{/if}
		{/if}
	</div>
</div>
