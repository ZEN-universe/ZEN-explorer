<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import Dropdown from '../../../components/Dropdown.svelte';
	import { get_energy_balance, get_unit } from '$lib/temple';
	import BarPlot from '../../../components/BarPlot.svelte';
	import { filter_and_aggregate_data } from '$lib/utils';
	import { tick } from 'svelte';
	import { get_variable_name } from '$lib/variables';
	import type { ChartConfiguration, ChartDataset } from 'chart.js';
	import Filters from '../../../components/Filters.svelte';
	import FilterSection from '../../../components/FilterSection.svelte';

	var defaultColors = [
		'rgb(75, 192, 192)',
		'rgb(54, 162, 235)',
		'rgb(255, 206, 86)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(255, 99, 132)',
		'rgb(201, 203, 207)',
		'rgb(220,20,60)',
		'rgb(255,99,71)',
		'rgb(255,69,0)',
		'rgb(154,205,50)',
		'rgb(0,100,0)',
		'rgb(50,205,50)',
		'rgb(0,139,139)',
		'rgb(153,50,204)',
		'rgb(255,105,180)'
	];

	let selected_solution: ActivatedSolution | null = $state(null);
	let plot_ready = $state(false);
	let solution_loading: boolean = $state(false);
	let fetching = $state(false);

	let nodes: string[] = $state([]);
	let selected_node: string | null = $state(null);

	let carriers: string[] = $state([]);
	let selected_carrier: string | null = $state(null);

	let years: number[] = $state([]);
	let selected_year: string | null = $state(null);

	let unit: string = $state('');
	let plot_name: string = $state('');

	const window_sizes = ['Hourly', 'Daily', 'Weekly', 'Monthly'].map((size) => ({
		label: size,
		value: size
	}));
	let selected_window_size = $state('Hourly');

	interface StringList {
		[key: string]: string[];
	}

	let datasets: ChartDataset[] = $state([]);
	let labels: string[] = $state([]);

	const plot_config: ChartConfiguration = $derived({
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
						text: `Power [${unit}]`
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
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x'
			}
		}
	});

	// let config = $state(structuredClone(initial_config));

	/**
	 * This function is being called, when a change event is received from the SolutionFilter.
	 * It will update the selected variables and reload the data.
	 */
	async function solution_changed() {
		if (!selected_solution) {
			return;
		}
		// config = structuredClone(initial_config);

		selected_node = nodes[0];
		selected_carrier = carriers[0];
		selected_year = years.length > 0 ? years[0].toString() : null;
		plot_ready = false;

		await data_changed();
		return;
	}

	/**
	 * This function fetches the energy balance dataframe from the api server and all the data according to the selected variables and fields.
	 * Once fetched, it adds all the data to the datasets for the plots.
	 */
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

		// Calculate index of year
		let year_index = Math.floor(
			(Number(selected_year) - selected_solution.detail.system.reference_year) /
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

		// Fetch the energy balance data
		let energy_balance_data = await get_energy_balance(
			selected_solution.solution_name,
			selected_node,
			selected_carrier,
			selected_solution.scenario_name,
			year_index,
			window_size
		);

		// Fetch the units
		let unit_data = await get_unit(
			selected_solution.solution_name,
			get_variable_name('flow_export', selected_solution.version),
			selected_solution.scenario_name
		);

		if (unit_data === null) {
			unit = '';
		} else {
			unit = unit_data.data[0][0];
		}

		datasets = [];
		let i = 0;

		// Loop through the energy balance dataframes and add them to the plots
		for (const plot_name in energy_balance_data) {
			let dataset_selector: StringList = {
				node: [selected_node!]
			};

			// Some plots might not have data
			if (
				energy_balance_data[plot_name] == undefined ||
				energy_balance_data[plot_name].data.length == 0
			) {
				continue;
			}

			// If the dataframe has a row "technology", add all of them to the list of technologies
			if ('technology' in energy_balance_data[plot_name].data[0]) {
				let technologies = [];
				for (const row of energy_balance_data[plot_name].data) {
					technologies.push(row['technology']);
				}
				dataset_selector = {
					technology: technologies
				};
			}

			let datasets_aggregates: StringList = {};

			let current_plots = filter_and_aggregate_data(
				energy_balance_data[plot_name].data,
				dataset_selector,
				datasets_aggregates
			);

			if (current_plots.length == 0) {
				continue;
			}

			// Loop through the different variables
			for (let current_plot of current_plots) {
				if (Object.keys(current_plot.data).length == 0) {
					continue;
				}

				// Get label-name for the plot
				switch (plot_name) {
					case get_variable_name('flow_storage_discharge', selected_solution.version):
						current_plot.label = current_plot.label + ' (discharge)';
						break;
					case get_variable_name('flow_transport_in', selected_solution.version):
						current_plot.label = current_plot.label + ' (transport in)';
						break;
					case get_variable_name('flow_import', selected_solution.version):
						(current_plot.label = 'Import'), selected_solution.version;
						break;
					case get_variable_name('shed_demand', selected_solution.version):
						current_plot.label = 'Shed Demand';
						break;
					case get_variable_name('flow_storage_charge', selected_solution.version):
						current_plot.label = current_plot.label + ' (charge)';
						break;
					case get_variable_name('flow_transport_out', selected_solution.version):
						current_plot.label = current_plot.label + ' (transport out)';
						break;
					case get_variable_name('flow_export', selected_solution.version):
						current_plot.label = 'Export';
						break;
					default:
						break;
				}

				let plot_type = 'line';

				// If only one timestep is available, it should be a bar plot
				if (Object.keys(current_plot.data).length == 1) {
					plot_type = 'bar';
				}

				// Demand is plotted in a different way than the other plots
				if (plot_name == 'demand') {
					current_plot.label = 'Demand';
					current_plot.type = 'line';
					current_plot.stack = 'ownCustomStack';
					current_plot.fill = false;
					current_plot.borderColor = 'black';
					current_plot.backgroundColor = 'white';
					current_plot.borderWidth = 2;
					current_plot.stepped = true;
					if (Object.keys(current_plot.data).length == 1) {
						current_plot.pointRadius = 2;
					}
				} else {
					current_plot.type = plot_type;
					current_plot.fill = 'origin';
					current_plot.borderColor = defaultColors[i % defaultColors.length];
					current_plot.backgroundColor = defaultColors[i % defaultColors.length]!.replace(
						')',
						', 1)'
					);
					current_plot.stepped = true;
					current_plot.cubicInterpolationMode = 'monotone';
				}
				datasets.push(current_plot);

				i++;
			}
		}

		// Finalize plot-config
		labels = Object.keys(datasets[0].data);

		fetching = false;
		plot_ready = true;
		await tick();

		let solution_names = selected_solution!.solution_name.split('.');

		// Define the filename when downloading
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			'balance',
			selected_carrier,
			selected_node,
			selected_year
		].join('_');
	}
</script>

<h2>The Energy Balance</h2>
<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:carriers
			bind:nodes
			bind:years
			bind:selected_solution
			bind:loading={solution_loading}
			solution_selected={solution_changed}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Data Selection">
			<div class="row">
				<div class="col-6">
					<Dropdown
						label="Year"
						options={years.map((year) => ({
							label: year.toString(),
							value: year.toString()
						}))}
						bind:value={selected_year}
						disabled={fetching || solution_loading}
						onUpdate={data_changed}
					></Dropdown>
				</div>
			</div>
			<div class="row">
				<div class="col-6">
					<Dropdown
						label="Node"
						options={nodes.map((node) => ({ label: node, value: node }))}
						bind:value={selected_node}
						disabled={fetching || solution_loading}
						onUpdate={data_changed}
					></Dropdown>
				</div>
			</div>
			<div class="row">
				<div class="col-6">
					<Dropdown
						label="Carrier"
						options={carriers.map((carrier) => ({ label: carrier, value: carrier }))}
						bind:value={selected_carrier}
						disabled={fetching || solution_loading}
						onUpdate={data_changed}
					></Dropdown>
				</div>
			</div>
			<div class="row">
				<div class="col-6">
					<Dropdown
						label="Smoothing Window Size"
						options={window_sizes}
						bind:value={selected_window_size}
						disabled={fetching || solution_loading}
						onUpdate={data_changed}
					></Dropdown>
				</div>
			</div>
		</FilterSection>
	{/if}
</Filters>
<div class="mt-4">
	{#if fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
	{#if !fetching && plot_ready}
		<div style="position: relative;">
			<BarPlot config={plot_config} {plot_name} zoom={true}></BarPlot>
		</div>
	{/if}
</div>
