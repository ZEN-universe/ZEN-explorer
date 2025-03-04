<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import BarPlot from '../../../components/BarPlot.svelte';
	import Dropdown from '../../../components/Dropdown.svelte';

	import type { ActivatedSolution, Row } from '$lib/types';
	import { get_full_ts } from '$lib/temple';
	import { filter_and_aggregate_data } from '$lib/utils';
	import Papa from 'papaparse';
	import { get_variable_name } from '$lib/variables';
	import ToggleButton from '../../../components/ToggleButton.svelte';
	import type { ChartConfiguration } from 'chart.js';

	interface StringList {
		[key: string]: string[];
	}

	let data: Papa.ParseResult<Row> | null = $state(null);
	let filtered_data: any[] | null = $state(null);

	let carriers: string[] = $state([]);
	let locations: string[] = $state([]);
	let technologies: string[] = $state([]);

	let unit: Papa.ParseResult<Row> | null = null;

	let selected_solution: ActivatedSolution | null = $state(null);
	const selected_variable: string = 'storage_level';
	let selected_carrier: string | null = $state(null);
	// let selected_aggregation = 'technology';
	let selected_technologies: string[] = [];
	let selected_locations: string[] = $state([]);

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plot_name: string = $state('');
	let subdivision: boolean = $state(true);
	let years: number[] = $state([]);
	let selected_year: number = $state(0);

	const window_sizes = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
	let selected_window_size = $state('Hourly');

	let datasets: any[] = $state([]);
	let labels: string[] = $state([]);
	let scaleXLabel: string = $state('Time');
	let scaleYLabel: string = $state('Power');
	let plot_config: ChartConfiguration<'line', number[], string> = $derived({
		type: 'line',
		data: { datasets: datasets, labels: labels },
		options: {
			animation: false,
			normalized: true,
			elements: {
				point: {
					radius: 0
				}
			},
			responsive: true,
			scales: {
				x: {
					stacked: true,
					title: {
						display: true,
						text: scaleXLabel
					}
				},
				y: {
					stacked: false,
					beginAtZero: true,
					title: {
						display: true,
						text: scaleYLabel
					}
				}
			},
			borderWidth: 1,
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						modifierKey: 'ctrl',
						mode: 'x'
					},
					zoom: {
						drag: {
							enabled: true
						},
						wheel: {
							enabled: true
						},
						mode: 'x'
					},
					limits: {
						x: { minRange: 10 }
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
		selected_locations = locations;
		selected_technologies = technologies;
		// selected_aggregation = 'node';
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
				selected_solution.detail.system.interval_between_years
		);

		let window_size = 1;

		switch (selected_window_size) {
			case 'Daily':
				window_size = 24;
				break;
			case 'Weekly':
				window_size = 168;
				break;
			case 'Monthly':
				window_size = 720;
				break;
		}

		let fetched = await get_full_ts(
			selected_solution!.solution_name,
			get_variable_name(selected_variable),
			selected_solution!.scenario_name,
			year_index,
			window_size
		);

		data = fetched.data;
		unit = fetched.unit;
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
			return '';
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
	 * This function updates the available technologies depending on the currently selected carrier and resets the currently selected technologies.
	 */
	function update_technologies() {
		let all_technologies = Array.from(new Set(data!.data.map((a: any) => a.technology)));

		technologies = all_technologies.filter(
			(technology) => selected_solution?.detail.reference_carrier[technology] == selected_carrier
		);
		selected_technologies = technologies;
	}

	/**
	 * This function updates the data for the plot depending on the currently selected values.
	 */
	function update_plot_data() {
		if (selected_locations.length == 0 || selected_technologies.length == 0 || data === null) {
			datasets = [];
			labels = [];
			plot_name = '';
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};
		dataset_selector['technology'] = selected_technologies;
		datasets_aggregates['node'] = selected_locations;

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			[],
			false,
			'line'
		);

		if (subdivision) {
			datasets = filtered_data;
			labels = Object.keys(filtered_data[0].data);
		} else {
			let new_data: any = {};
			for (const i in filtered_data[0].data) {
				new_data[i] = filtered_data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}
			filtered_data = [
				{
					data: Object.values(new_data),
					label: 'Storage level',
					type: 'line',
					borderColor: 'black'
				}
			];

			datasets = filtered_data;
			labels = Object.keys(new_data);
		}

		scaleYLabel = selected_variable + ' [' + get_unit() + ']';

		let solution_names = selected_solution!.solution_name.split('.');
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			selected_variable,
			selected_carrier
		].join('_');
	}
</script>

<h2>The Energy Balance Storage</h2>
<div class="position-relative z-1">
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
							bind:selected_solution
							bind:loading={solution_loading}
							bind:years
							solution_selected={solution_changed}
							enabled={!fetching && !solution_loading}
						/>
					</div>
				</div>
			</div>
			{#if !solution_loading && selected_solution}
				<div class="accordion-item variable-selction">
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
							{#if carriers.length > 0}
								<h3>Carrier</h3>
								<select
									bind:value={selected_carrier}
									onchange={data_changed}
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
									options={years}
									bind:selected_option={selected_year}
									selection_changed={data_changed}
									enabled={!fetching && !solution_loading}
								></Dropdown>
								<h3>Smoothing Window Size</h3>
								<Dropdown
									options={window_sizes}
									bind:selected_option={selected_window_size}
									selection_changed={data_changed}
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
								<h3>Technology Subdivision</h3>
								<ToggleButton bind:value={subdivision} change={update_plot_data}></ToggleButton>

								<h3>Node</h3>
								<AllCheckbox
									elements={locations}
									bind:selected_elements={selected_locations}
									selection_changed={update_plot_data}
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
		<BarPlot config={plot_config} {plot_name} zoom={true}></BarPlot>
	{/if}
</div>
