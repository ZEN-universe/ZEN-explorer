<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import Radio from '../../../components/Radio.svelte';
	import BarPlot from '../../../components/BarPlot.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data } from '$lib/utils';
	import { tick } from 'svelte';
	import Papa from 'papaparse';
	import type { ChartConfiguration } from 'chart.js';

	interface StringList {
		[key: string]: string[];
	}

	let technology_types: string[] = ['conversion', 'storage', 'transport'];
	let data: Papa.ParseResult<Row> | null = $state(null);
	let filtered_data: any[] | null = $state(null);
	let variables: string[] = ['capacity', 'capacity_addition'];
	let carriers: string[] = $state([]);
	let locations: string[] = $state([]);
	let years: number[] = $state([]);
	let technologies: string[] = $state([]);
	let selected_solution: ActivatedSolution | null = $state(null);
	let aggregation_options = $state(['technology', 'node']);
	const normalisation_options = ['not_normalized', 'normalized'];
	const storage_type_options = ['energy', 'power'];
	let unit: Papa.ParseResult<Row> | null = null;
	let selected_variable: string | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let selected_storage_type = $state('energy');
	let selected_aggregation = $state('technology');
	let selected_technology_type: string | null = $state(null);
	let selected_technologies: string[] = $state([]);
	let selected_years: number[] = $state([]);
	let selected_locations: string[] = $state([]);
	let selected_normalisation: string = $state('not_normalized');
	let solution_loading: boolean = $state(false);

	let fetching: boolean = $state(false);
	let plot_name: string = $state('');

	let datasets: any[] = $state([]);
	let labels: string[] = $state([]);
	let scaleYText: string = $state('');

	let plot_config: ChartConfiguration<'bar'> = $derived({
		type: 'bar',
		data: { datasets: datasets, labels: labels },
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
						text: scaleYText
					}
				}
			}
		}
	});

	/**
	 * This function sets all the necessary variables back to the initial state in order to reset the plot.
	 *
	 */
	function reset_data_selection() {
		selected_normalisation = 'not_normalized';
		selected_locations = locations;
		selected_technologies = technologies;
		selected_years = years;
		selected_aggregation = 'node';
	}

	/**
	 * This function fetches the data from the api of the selected values in the form
	 */
	async function fetch_data() {
		fetching = true;
		data = null;
		await tick();

		if (selected_variable === null) {
			fetching = false;
			return;
		}

		get_component_total(
			selected_solution!.solution_name,
			selected_variable,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years
		).then((fetched) => {
			data = fetched.data;
			unit = fetched.unit;
			fetching = false;
		});
	}

	/**
	 * This function is called is called whenever the solution filter sends a change event.
	 * It resets all the selected values of the form.
	 */
	function solution_changed() {
		data = null;
		selected_variable = null;
		filtered_data = null;
		selected_technology_type = null;
		selected_carrier = null;
	}

	/**
	 * This function is called, whenever the variable in the form is changed.
	 * It will fetch the necessary data from the API.
	 */
	function variable_changed() {
		fetch_data();
	}

	/**
	 * This function is called, when the technology type is changed. It updates all the necessary values for further selection in the form.
	 */
	function technology_type_changed() {
		update_carriers();
		update_technologies();
		update_locations();
		reset_data_selection();
		update_plot_data();
	}

	/**
	 * This function is called, when the carrier is changed. It updates all the necessary values for further selection in the form.
	 */
	function carrier_changed() {
		update_technologies();
		update_locations();
		reset_data_selection();
		update_plot_data();
	}

	/**
	 * This function updates the available carriers for the current variable selection.
	 */
	function update_carriers() {
		carriers = [];
		if (data === null || selected_technology_type === null) {
			return;
		}

		// Get the technologies for the current technology type
		let all_technologies: string[] = get_technologies_by_type();

		// Add all the available carriers to the set of carriers for the current set of technologies
		data.data.forEach((element) => {
			let current_technology = element.technology;
			let current_carrier = selected_solution!.detail.reference_carrier[current_technology];

			if (!carriers.includes(current_carrier) && all_technologies.includes(element.technology)) {
				carriers.push(current_carrier);
			}
		});

		if (carriers.length > 0) {
			selected_carrier = carriers[0];
		}
	}

	/**
	 * This function updates the available locations for the current variable selection.
	 */
	function update_locations() {
		locations = [];

		data!.data.forEach((element) => {
			let current_technology = element.technology;
			let current_carrier = selected_solution!.detail.reference_carrier[current_technology];

			if (technologies.includes(element.technology) && !locations.includes(element.location)) {
				locations.push(element.location);
			}

			if (!carriers.includes(current_carrier) && technologies.includes(element.technology)) {
				carriers.push(current_carrier);
			}
		});

		selected_locations = locations;
	}

	/**
	 * This function returns the relevant technologies given the currently selected technology type
	 */
	function get_technologies_by_type() {
		if (!selected_solution || !selected_technology_type) {
			return [];
		}

		switch (selected_technology_type) {
			case 'conversion':
				return selected_solution.detail.system.set_conversion_technologies;
			case 'storage':
				return selected_solution.detail.system.set_storage_technologies;
			case 'transport':
				return selected_solution.detail.system.set_transport_technologies;
		}

		return [];
	}

	/**
	 * This function returns the unit of the currently selected variable
	 */
	function get_unit() {
		if (unit != null) {
			for (const u of unit.data) {
				if (!u.capacity_type) {
					continue;
				}

				if (selected_technology_type == 'storage' && selected_storage_type != u.capacity_type) {
					continue;
				}

				if (technologies[0] == u.technology) {
					return u[0] || u['units'] || '';
				}
			}
		}
		return '';
	}

	/**
	 * This function updates the available technologies depending on the currently selected carrier and resets the currently selected technologies.
	 */
	function update_technologies() {
		if (selected_technology_type === null) {
			return;
		}

		let all_technologies = get_technologies_by_type();

		technologies = all_technologies.filter(
			(technology) => selected_solution?.detail.reference_carrier[technology] == selected_carrier
		);
		selected_technologies = technologies;
	}

	/**
	 * This function updates the data for the plot depending on the currently selected values.
	 */
	function update_plot_data() {
		if (selected_aggregation == 'technology') {
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

		if (selected_aggregation == 'technology') {
			dataset_selector['location'] = selected_locations;
			datasets_aggregates['technology'] = selected_technologies;
		} else {
			dataset_selector['technology'] = selected_technologies;
			datasets_aggregates['location'] = selected_locations;
		}

		if (selected_technology_type == 'storage') {
			datasets_aggregates['capacity_type'] = [selected_storage_type];
		} else {
			datasets_aggregates['capacity_type'] = storage_type_options;
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == 'normalized'
		);
		datasets = filtered_data;

		// @ts-ignore
		scaleYText = selected_variable + ' [' + get_unit() + ']';

		let solution_names = selected_solution!.solution_name.split('.');
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			selected_variable,
			selected_technology_type,
			selected_carrier
		].join('_');
	}
</script>

<h2>Capacity</h2>
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
							bind:years
							bind:selected_solution
							bind:loading={solution_loading}
							solution_selected={solution_changed}
							enabled={!fetching && !solution_loading}
						/>
					</div>
				</div>
			</div>
			{#if !solution_loading && selected_solution}
				<div class="accordion-item variable-selection">
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
							<h3>Variable</h3>
							<select
								class="form-select"
								bind:value={selected_variable}
								onchange={(e) => {
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

							{#if selected_variable != null}
								<h3>Technology Type</h3>
								<select
									class="form-select"
									bind:value={selected_technology_type}
									onchange={() => {
										technology_type_changed();
									}}
									disabled={fetching || solution_loading}
								>
									{#each technology_types as technology_type}
										<option value={technology_type}>
											{technology_type}
										</option>
									{/each}
								</select>
								{#if selected_technology_type == 'storage'}
									<Radio
										options={storage_type_options}
										bind:selected_option={selected_storage_type}
										selection_changed={technology_type_changed}
										enabled={!fetching && !solution_loading}
									></Radio>
								{/if}
							{/if}
							{#if selected_technology_type != null && carriers.length > 0}
								<h3>Carrier</h3>
								<select
									class="form-select"
									bind:value={selected_carrier}
									onchange={() => {
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
				{#if data && selected_technology_type && selected_carrier && technologies.length > 0 && locations.length > 0}
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
								{#if selected_aggregation == 'technology'}
									<h3>Technology</h3>
									<AllCheckbox
										selected_elements={selected_technologies}
										elements={technologies}
										selection_changed={() => {
											update_plot_data();
										}}
									></AllCheckbox>
								{:else}
									<h3>Node</h3>
									<AllCheckbox
										selected_elements={selected_locations}
										elements={locations}
										selection_changed={(e) => {
											update_plot_data();
										}}
									></AllCheckbox>
								{/if}

								<h3>Year</h3>
								<AllCheckbox
									selected_elements={selected_years}
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
		<BarPlot config={plot_config} {plot_name}></BarPlot>
	{/if}
</div>
