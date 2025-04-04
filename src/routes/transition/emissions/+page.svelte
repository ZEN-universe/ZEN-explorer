<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import Radio from '../../../components/Radio.svelte';
	import { get_component_total, get_solution_detail } from '$lib/temple';
	import { filter_and_aggregate_data, group_data } from '$lib/utils';
	import { tick } from 'svelte';
	import BarPlot from '../../../components/BarPlot.svelte';
	import { get_variable_name } from '$lib/variables';
	import type { ChartConfiguration } from 'chart.js';

	let data: Papa.ParseResult<any> | null;
	let limit_data: Papa.ParseResult<any> | null;
	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);
	let years: number[] = $state([]);
	let locations: string[] = $state([]);
	let variables: string[] = $state(['Annual', 'Cumulative']);
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_years: number[] = $state([]);
	const normalisation_options = ['not_normalized', 'normalized'];
	let selected_normalisation: string = $state('not_normalized');
	let aggregation_options: string[] = $state([]);
	let selected_locations: string[] = $state([]);
	let units: { [carrier: string]: string } = $state({});
	let filtered_data: any[] = $state([]);
	let selected_variable: string | null = $state(null);
	let selected_grouping: string | null = $state(null);
	let subdivision: boolean = $state(true);
	let selected_carriers: string[] = $state([]);
	let selected_technologies: string[] = $state([]);
	let selected_aggregation: string = $state('technology');
	let technologies: string[] = $state([]);
	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plot_name = $state('plot');

	interface StringList {
		[key: string]: string[];
	}

	let plot_config: ChartConfiguration = $derived({
		type: 'bar',
		data: { datasets: filtered_data },
		options: {
			responsive: true,
			scales: {
				x: {
					stacked: true,
					title: {
						display: true,
						text: 'Year'
					}
				},
				y: {
					stacked: true,
					title: {
						display: true,
						text: `Emissions [${selected_carriers.length > 0 ? units[selected_carriers[0]] : ''}]`
					}
				}
			}
		}
	});

	/**
	 * This function resets selected values of the form. It is called whenever the selected solution or the selected subdivision is changed.
	 */
	function reset_subsection() {
		selected_variable = null;
		selected_grouping = null;
		filtered_data = [];
		selected_carriers = [];
		selected_technologies = [];

		if (subdivision) {
			selected_grouping = 'technology_carrier';
			fetch_subdivision_data();
		}
	}

	/**
	 * This function gets the currently relevant variable name based on the subdivision and variable selection.
	 */
	function get_division_variable() {
		if (subdivision) {
			return get_variable_name('carbon_emissions_carrier', selected_solution?.version);
		} else {
			if (selected_variable == variables[0]) {
				return get_variable_name('carbon_emissions_annual', selected_solution?.version);
			} else {
				return get_variable_name('carbon_emissions_cumulative', selected_solution?.version);
			}
		}
	}
	/**
	 * This function fetches the relevant data if subdivision is active.
	 * In that case, we need the data series carbon_emissions_technology and carbon_emissions_carrier.
	 * We then combine the data series by renaming the "technology" column and the "carrier" column in the two respective data sets into "technology_carrier".
	 */
	async function fetch_subdivision_data() {
		if (!selected_solution) {
			return;
		}
		fetching = true;

		// Fetch carbon_emissions_technology
		let carbon_emissions_technology = await get_component_total(
			selected_solution!.solution_name,
			get_variable_name('carbon_emissions_technology', selected_solution?.version),
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years
		);

		// Fetch carbon_emissions_carrier
		let carbon_emissions_carrier = await get_component_total(
			selected_solution!.solution_name,
			get_variable_name('carbon_emissions_carrier', selected_solution?.version),
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years
		);

		let set_carriers = new Set<string>();
		let set_technologies = new Set<string>();
		let set_locations = new Set<string>();

		for (let i of carbon_emissions_technology.data!.data) {
			set_technologies.add(i.technology);
			set_locations.add(i.location);
		}

		// Rename "node" to "location" so both data series have the same location-name
		for (let i of carbon_emissions_carrier.data!.data) {
			set_carriers.add(i.carrier);
			set_locations.add(i.node);

			if (Object.hasOwn(i, 'node')) {
				let location = Object.getOwnPropertyDescriptor(i, 'node');

				if (location === undefined) {
					continue;
				}

				Object.defineProperty(i, 'location', location);
			}

			delete i['node'];
		}

		// Rename "carrier" and "technology" columns into technology_carrier and group all datasets into one list.
		data = group_data('technology_carrier', [
			['carrier', carbon_emissions_carrier.data!],
			['technology', carbon_emissions_technology.data!]
		]);

		technologies = [...set_technologies];
		carriers = [...set_carriers];
		locations = [...set_locations];

		if (carbon_emissions_carrier.unit?.data) {
			units = Object.fromEntries(
				carbon_emissions_carrier.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;

		update_filters();
	}

	/**
	 * Fetch the relevant data if subdivision is not activated.
	 */
	async function fetch_data() {
		fetching = true;
		await tick();

		let variable_name = get_division_variable();
		if (variable_name === null) {
			return;
		}

		// If annual emissions are selected, we want to add carbon_emissions_annual_limit and if cumulative is selected we add a constant carbon_emissions_budget
		if (variable_name == get_variable_name('carbon_emissions_annual', selected_solution?.version)) {
			let res = await get_component_total(
				selected_solution!.solution_name,
				get_variable_name('carbon_emissions_annual_limit', selected_solution?.version),
				selected_solution!.scenario_name,
				selected_solution!.detail.system.reference_year,
				selected_solution!.detail.system.interval_between_years
			);
			limit_data = res.data;
		} else {
			let res = await get_component_total(
				selected_solution!.solution_name,
				get_variable_name('carbon_emissions_budget', selected_solution?.version),
				selected_solution!.scenario_name,
				selected_solution!.detail.system.reference_year,
				selected_solution!.detail.system.interval_between_years
			);

			// Add first value to all years

			if (res.data) {
				for (const year of years) {
					res.data.data[0][year] = res.data.data[0][years[0]];
				}
			}
			limit_data = res.data;
		}

		// Get variable values
		const fetched = await get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years
		);

		data = fetched.data;

		if (fetched.unit?.data) {
			units = Object.fromEntries(
				fetched.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	/**
	 * This function updates the possible values of the filters and updates the plot data once the filters have been updated.
	 */
	function update_filters() {
		aggregation_options = ['location'];

		if (selected_grouping) {
			aggregation_options = ['location', selected_grouping];
		}

		selected_carriers = carriers;
		selected_technologies = technologies;
		selected_locations = locations;
		selected_aggregation = 'location';

		fetching = false;
		update_plot_data();
	}

	/**
	 * This function prepares all the necessary data for the plots based on the users selection in the form.
	 */
	function update_plot_data() {
		if (!data) {
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (subdivision) {
			if (selected_aggregation != 'location') {
				dataset_selector['location'] = locations;
				datasets_aggregates['technology_carrier'] = selected_technologies.concat(selected_carriers);
			} else {
				dataset_selector['technology_carrier'] = technologies.concat(carriers);
				datasets_aggregates['location'] = selected_locations;
			}
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == 'normalized'
		);

		if (filtered_data.length == 0) {
			return;
		}

		if (filtered_data.length == 1 && !subdivision) {
			filtered_data[0].label = get_division_variable();
		}

		if (limit_data) {
			let filtered_limit_data = filter_and_aggregate_data(
				limit_data.data,
				dataset_selector,
				datasets_aggregates,
				excluded_years,
				selected_normalisation == 'normalized'
			);

			if (filtered_limit_data.length > 0) {
				filtered_limit_data[0].label =
					selected_variable == variables[0] ? 'Annual Emissions Limit' : 'Carbon Emissions Budget';
				filtered_limit_data[0].type = 'line';
				filtered_data = filtered_data.concat(filtered_limit_data);
			}
		}

		let solution_names = selected_solution!.solution_name.split('.');
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			get_division_variable()
		].join('_');
	}
</script>

<h2>Emissions</h2>

<div class="z-1 position-relative">
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
				<div id="collapseOne" class="accordion-collapse collapse show">
					<div class="accordion-body">
						<SolutionFilter
							bind:carriers
							bind:nodes
							bind:years
							bind:selected_solution
							bind:loading={solution_loading}
							solution_selected={() => {
								reset_subsection();
								selected_years = years;
							}}
							enabled={!solution_loading && !fetching}
						/>
					</div>
				</div>
			</div>
			{#if !solution_loading && selected_solution}
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseTwo"
							aria-expanded="false"
							aria-controls="collapseTwo"
						>
							Variable Selection
						</button>
					</h2>
					<div id="collapseTwo" class="accordion-collapse collapse show">
						<div class="accordion-body">
							<h3>Subdivision</h3>
							<input
								type="checkbox"
								class="btn-check"
								id="btn-check-outlined"
								autocomplete="off"
								bind:checked={subdivision}
								onchange={reset_subsection}
								disabled={fetching || solution_loading}
							/>
							<label class="btn btn-outline-primary" for="btn-check-outlined"
								>{subdivision ? 'on' : 'off'}</label
							><br />
							{#if !subdivision}
								<h3>Cumulation</h3>
								<Radio
									options={variables}
									bind:selected_option={selected_variable}
									selection_changed={fetch_data}
									enabled={!fetching && !solution_loading}
								></Radio>
							{/if}
						</div>
					</div>
				</div>
				{#if !fetching && (selected_variable || selected_grouping)}
					<div class="accordion-item">
						<h2 class="accordion-header">
							<button
								class="accordion-button"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#collapseThree"
								aria-expanded="false"
								aria-controls="collapseThree"
							>
								Data Selection
							</button>
						</h2>
						<div id="collapseThree" class="accordion-collapse collapse show">
							<div class="accordion-body">
								{#if subdivision}
									<div class="row">
										<div class="col-6">
											<h3>Aggregation</h3>
											<Radio
												options={aggregation_options}
												bind:selected_option={selected_aggregation}
												selection_changed={(_) => update_plot_data()}
											></Radio>
										</div>
										<div class="col-6">
											<h3>Normalisation</h3>
											<Radio
												options={normalisation_options}
												bind:selected_option={selected_normalisation}
												selection_changed={(_) => update_plot_data()}
											></Radio>
										</div>
									</div>
									{#if selected_aggregation != 'location'}
										{#if technologies.length > 0}
											<h3>Technology</h3>
											<AllCheckbox
												bind:selected_elements={selected_technologies}
												elements={technologies}
												selection_changed={() => {
													update_plot_data();
												}}
											></AllCheckbox>
										{/if}
										{#if carriers.length > 0}
											<h3>Carrier</h3>
											<AllCheckbox
												bind:selected_elements={selected_carriers}
												elements={carriers}
												selection_changed={(e) => {
													update_plot_data();
												}}
											></AllCheckbox>
										{/if}
									{:else}
										<h3>Location</h3>
										<AllCheckbox
											bind:selected_elements={selected_locations}
											elements={locations}
											selection_changed={(e) => {
												update_plot_data();
											}}
										></AllCheckbox>
									{/if}
								{/if}
								<h3>Year</h3>
								<AllCheckbox
									bind:selected_elements={selected_years}
									elements={years}
									selection_changed={(e) => {
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
<div class="mt-4">
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
			<BarPlot config={plot_config} {plot_name}></BarPlot>
		{/if}
	{/if}
</div>
