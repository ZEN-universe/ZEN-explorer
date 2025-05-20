<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import BarPlot from '../../../components/BarPlot.svelte';
	import Dropdown from '../../../components/Dropdown.svelte';

	import type { ActivatedSolution, Row } from '$lib/types';
	import { get_full_ts } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates } from '$lib/utils';
	import Papa from 'papaparse';
	import { get_variable_name } from '$lib/variables';
	import ToggleButton from '../../../components/ToggleButton.svelte';
	import type { ChartConfiguration } from 'chart.js';
	import Filters from '../../../components/Filters.svelte';
	import FilterSection from '../../../components/FilterSection.svelte';

	interface StringList {
		[key: string]: string[];
	}

	let data: Papa.ParseResult<Row> | null = $state(null);
	let chargeData: Papa.ParseResult<Row> | null = $state(null);
	let dischargeData: Papa.ParseResult<Row> | null = $state(null);
	let spillageData: Papa.ParseResult<Row> | null = $state(null);
	let inflowData: Papa.ParseResult<Row> | null = $state(null);
	let filtered_data: any[] | null = $state(null);
	let charge_filtered_data: any[] | null = $state(null);
	let discharge_filtered_data: any[] | null = $state(null);
	let inflow_filtered_data: any[] | null = $state(null);
	let spillage_filtered_data: any[] | null = $state(null);

	let carriers: string[] = $state([]);
	let locations: string[] = $state([]);
	let technologies: string[] = $state([]);

	let units: { [carrier: string]: string } = $state({});

	let selected_solution: ActivatedSolution | null = $state(null);
	const selected_variable: string = 'storage_level';
	let selected_carrier: string | null = $state(null);
	let selected_technologies: string[] = [];
	let selected_locations: string[] = $state([]);

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plot_name: string = $state('');
	let plot_name_flows: string = $state('');
	let subdivision: boolean = $state(true);
	let years: number[] = $state([]);
	let selected_year: string = $state('');

	const window_sizes = ['Hourly', 'Daily', 'Weekly', 'Monthly'].map((size) => ({
		label: size,
		value: size
	}));
	let selected_window_size = $state('Hourly');

	let level_plot = $state<BarPlot>();
	let flow_plot = $state<BarPlot>();

	let datasets: any[] = $state([]);
	let flow_datasets: any[] = $state([]);
	let labels: string[] = $state([]);
	let unit: string = $derived(technologies.length > 0 ? units[technologies[0]] : '');

	let plot_config: ChartConfiguration = $derived({
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
						text: 'Time'
					}
				},
				y: {
					stacked: true,
					beginAtZero: true,
					title: {
						display: true,
						text: `Storage Level [${unit}]`
					}
				}
			},
			borderWidth: 1,
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						modifierKey: 'ctrl',
						mode: 'x',
						onPanComplete: (event) => {
							flow_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max);
						}
					},
					zoom: {
						drag: {
							enabled: true
						},
						wheel: {
							enabled: true
						},
						mode: 'x',
						onZoomComplete: (event) => {
							flow_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max);
						}
					},
					limits: {
						x: { minRange: 10 }
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x',
			}
		}
	});
	let plot_config_flows: ChartConfiguration = $derived({
		counter: 1,
		type: 'line',
		data: { datasets: flow_datasets, labels: labels },
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
						text: 'Time'
					}
				},
				y: {
					type: 'linear',
					stacked: true,
					beginAtZero: true,
					title: {
						display: true,
						text: `Storage Flow [${unit}]`
					}
				}
			},
			borderWidth: 1,
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						modifierKey: 'ctrl',
						mode: 'x',
						onPanComplete: (event) => {
							level_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max);
						}
					},
					zoom: {
						drag: {
							enabled: true
						},
						wheel: {
							enabled: true
						},
						mode: 'x',
						onZoomComplete: (event) => {
							level_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max);
						}
					},
					limits: {
						x: { minRange: 10 }
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x',
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
			(parseInt(selected_year) - selected_solution.detail.system.reference_year) /
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

		const [levelResponse, chargeResponse, dischargeResponse, spillageResponse, inflowResponse] =
			await Promise.all([
				get_full_ts(
					selected_solution!.solution_name,
					get_variable_name('storage_level'),
					selected_solution!.scenario_name,
					year_index,
					window_size
				),
				get_full_ts(
					selected_solution!.solution_name,
					get_variable_name('flow_storage_charge'),
					selected_solution!.scenario_name,
					year_index,
					window_size
				),
				get_full_ts(
					selected_solution!.solution_name,
					get_variable_name('flow_storage_discharge'),
					selected_solution!.scenario_name,
					year_index,
					window_size
				),
				get_full_ts(
					selected_solution!.solution_name,
					get_variable_name('flow_storage_spillage'),
					selected_solution!.scenario_name,
					year_index,
					window_size
				),
				get_full_ts(
					selected_solution!.solution_name,
					get_variable_name('flow_storage_inflow'),
					selected_solution!.scenario_name,
					year_index,
					window_size
				)
			]);

		data = levelResponse.data;
		if (levelResponse.unit?.data) {
			units = Object.fromEntries(
				levelResponse.unit.data.map((u) => [u.technology, u[0] || u.units])
			);
		}
		chargeData = chargeResponse.data;
		dischargeData = dischargeResponse.data;
		spillageData = spillageResponse.data;
		inflowData = inflowResponse.data;
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
		selected_year = years.length > 0 ? years[0].toString() : '';

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
		locations = remove_duplicates(data!.data.map((a) => a.node));
		selected_locations = locations;
	}

	/**
	 * This function updates the available carriers for the current variable selection.
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
		let all_technologies = remove_duplicates(data!.data.map((a: any) => a.technology));

		technologies = all_technologies.filter(
			(technology) => selected_solution?.detail.reference_carrier[technology] == selected_carrier
		);
		selected_technologies = technologies;
	}

	/**
	 * This function updates the data for the plot depending on the currently selected values.
	 */
	function update_plot_data() {
		if (
			selected_locations.length == 0 ||
			selected_technologies.length == 0 ||
			data === null ||
			chargeData === null ||
			dischargeData === null ||
			inflowData === null ||
			spillageData === null
		) {
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
			'line',
			''
		).map((dataset) => {
			return {
				...dataset,
				fill: 'origin'
			};
		});
		charge_filtered_data = filter_and_aggregate_data(
			chargeData.data,
			dataset_selector,
			datasets_aggregates,
			[],
			false,
			'line',
			'_charge'
		).map((dataset) => {
			return {
				...dataset,
				stepped: true,
				fill: 'origin'
			};
		});
		discharge_filtered_data = filter_and_aggregate_data(
			dischargeData.data,
			dataset_selector,
			datasets_aggregates,
			[],
			false,
			'line',
			'_discharge'
		).map((dataset) => {
			let data: { [key: string]: number } = {};
			for (let i in dataset.data) {
				data[i] = dataset.data[i] > 0 ? -dataset.data[i] : dataset.data[i];
			}
			return {
				data,
				label: dataset.label,
				type: dataset.type,
				stepped: true,
				fill: 'origin'
			};
		});
		spillage_filtered_data = filter_and_aggregate_data(
			spillageData.data,
			dataset_selector,
			datasets_aggregates,
			[],
			false,
			'line',
			'_spillage'
		).map((dataset) => {
			let data: { [key: string]: number } = {};
			for (let i in dataset.data) {
				data[i] = dataset.data[i] > 0 ? -dataset.data[i] : dataset.data[i];
			}
			return {
				data,
				label: dataset.label,
				type: dataset.type,
				stepped: true,
				fill: 'origin'
			};
		});
		inflow_filtered_data = filter_and_aggregate_data(
			inflowData.data,
			dataset_selector,
			datasets_aggregates,
			[],
			false,
			'line',
			'_inflow'
		).map((dataset) => {
			return {
				...dataset,
				stepped: true,
				fill: 'origin'
			};
		});

		datasets = filtered_data;
		flow_datasets = charge_filtered_data
			.concat(discharge_filtered_data)
			.concat(inflow_filtered_data)
			.concat(spillage_filtered_data);
		labels = Object.keys(filtered_data[0].data);

		if (subdivision) {
			datasets = filtered_data;
			labels = Object.keys(filtered_data[0].data);
		} else {
			let new_data: { [key: string]: number } = {};
			for (const i in filtered_data[0].data) {
				new_data[i] = filtered_data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}
			let new_charge: { [key: string]: number } = {};
			for (const i in charge_filtered_data[0].data) {
				new_charge[i] = charge_filtered_data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}
			let new_discharge: { [key: string]: number } = {};
			for (const i in discharge_filtered_data[0].data) {
				new_discharge[i] = discharge_filtered_data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}
			let new_inflow: { [key: string]: number } = {};
			for (const i in inflowData.data[0]) {
				new_inflow[i] = inflowData.data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}
			let new_spillage: { [key: string]: number } = {};
			for (const i in spillageData.data[0]) {
				new_spillage[i] = spillageData.data
					.map((j) => j.data[i])
					.reduce((partialSum, a) => partialSum + a, 0);
			}

			datasets = [
				{
					data: Object.values(new_data),
					label: 'Storage level',
					type: 'line',
					borderColor: 'black',
					fill: 'origin',
					stepped: true
				}
			];
			flow_datasets = [
				{
					data: Object.values(new_charge),
					label: 'Flow Storage Charge',
					type: 'line',
					borderColor: 'blue',
					stepped: true
				},
				{
					data: Object.values(new_discharge),
					label: 'Flow Storage Discharge',
					type: 'line',
					borderColor: 'red',
					stepped: true
				},
				{
					data: Object.values(new_inflow),
					label: 'Flow Storage Discharge',
					type: 'line',
					borderColor: 'red',
					stepped: true
				},
				{
					data: Object.values(new_spillage),
					label: 'Flow Storage Discharge',
					type: 'line',
					borderColor: 'red',
					stepped: true
				}
			];
			labels = Object.keys(new_data);
		}

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
<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:loading={solution_loading}
			bind:years
			solution_selected={solution_changed}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Variable Selection">
			{#if carriers.length > 0}
				<Dropdown
					label="Carrier"
					options={carriers.map((carrier) => ({
						label: carrier,
						value: carrier
					}))}
					bind:value={selected_carrier}
					disabled={fetching || solution_loading}
					onUpdate={data_changed}
				></Dropdown>
				<Dropdown
					label="Year"
					options={years.map((year) => ({
						label: year.toString(),
						value: year.toString()
					}))}
					bind:value={selected_year}
					onUpdate={data_changed}
					disabled={fetching || solution_loading}
				></Dropdown>
				<Dropdown
					label="Smoothing Window Size"
					options={window_sizes}
					bind:value={selected_window_size}
					onUpdate={data_changed}
					disabled={fetching || solution_loading}
				></Dropdown>
			{/if}
		</FilterSection>
		{#if data && selected_carrier && technologies.length > 0 && locations.length > 0}
			<FilterSection title="Data Selection">
				<h3>Technology Subdivision</h3>
				<ToggleButton bind:value={subdivision} change={update_plot_data}></ToggleButton>
				<AllCheckbox
					label="Node"
					elements={locations}
					bind:value={selected_locations}
					onUpdate={update_plot_data}
				></AllCheckbox>
			</FilterSection>
		{/if}
	{/if}
</Filters>
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
		<BarPlot config={plot_config} {plot_name} zoom={true} bind:this={level_plot}></BarPlot>
		<BarPlot
			config={plot_config_flows}
			plot_name={plot_name_flows}
			zoom={true}
			bind:this={flow_plot}
		></BarPlot>
	{/if}
</div>
