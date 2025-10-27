<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Chart from '$components/Chart.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_energy_balance, get_unit } from '$lib/temple';
	import { toOptions } from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import { nextColor, resetColorState as reset_color_picker_state } from '$lib/colors';
	import type { ActivatedSolution, EnergyBalanceDataframes, Entry } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';

	let energy_balance_data: EnergyBalanceDataframes | null = null;
	let unit_data: any = $state(null);

	let solution_loading: boolean = $state(false);
	let fetching = $state(false);

	let plot = $state<Chart<any>>();
	let duals_plot = $state<Chart<any>>();

	let nodes: string[] = $state([]);
	let carriers: string[] = $state([]);
	let years: number[] = $state([]);
	const window_sizes = toOptions(['Hourly', 'Daily', 'Weekly', 'Monthly']);

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_node: string | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let selected_year: string | null = $state(null);
	let selected_window_size = $state('Hourly');

	let plot_name: string = $derived.by(() => {
		if (!selected_solution || !selected_solution.solution_name) {
			return '';
		}
		let solution_names = selected_solution.solution_name.split('.');
		return [
			solution_names[solution_names.length - 1],
			selected_solution.scenario_name,
			'balance',
			selected_carrier,
			selected_node,
			selected_year
		].join('_');
	});
	let duals_plot_name: string = $derived.by(() => {
		return plot_name + '_duals';
	});
	let unit = $derived.by(() => {
		if (unit_data === null) {
			return '';
		}
		let unit_entry = unit_data.data.find((entry: any) => entry['carrier'] === selected_carrier);
		if (unit_entry) {
			return unit_entry[0] || unit_entry['units'] || '';
		}
		return unit_data.data[0][0] || unit_data.data[0]['units'] || '';
	});

	// Zoom level for both plots
	let zoomLevel: [number, number] | null = $state(null);

	// Time steps per year (for x-axis scaling)
	let timeStepsPerYear: number = $state(0);
	$effect(() => {
		if (selected_solution?.detail?.system.unaggregated_time_steps_per_year !== undefined) {
			timeStepsPerYear = selected_solution.detail.system.unaggregated_time_steps_per_year;
		}
	});

	// Reset zoom when timeStepsPerYear changes
	$effect(() => {
		timeStepsPerYear;
		untrack(() => {
			zoomLevel = null;
		});
	});

	let plot_options: ChartOptions = $derived.by(() => getPlotOptions(`Energy [${unit}]`));
	let duals_plot_options: ChartOptions = $derived.by(() => getPlotOptions('Dual', false, 5, false));

	function getPlotOptions(
		yAxisLabel: string,
		showLegend: boolean = true,
		aspectRatio: number = 2,
		yAxisBeginAtZero: boolean = true
	): ChartOptions<'bar' | 'line'> {
		return {
			animation: false,
			normalized: true,
			parsing: false,
			responsive: true,
			borderWidth: 1,
			aspectRatio,
			elements: {
				point: {
					radius: 0
				}
			},
			scales: {
				x: {
					type: 'linear',
					stacked: true,
					title: {
						display: true,
						text: 'Time'
					},
					ticks: {
						maxRotation: 0,
						autoSkip: true,
						callback: (value) => Number(value).toFixed(0)
					},
					min: 0,
					max: timeStepsPerYear - 1
				},
				y: {
					stacked: true,
					beginAtZero: yAxisBeginAtZero,
					title: {
						display: true,
						text: yAxisLabel
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x'
			}
		} as ChartOptions<'bar' | 'line'>;
	}

	const plotPluginOptions: ChartOptions['plugins'] = {
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
				x: { minRange: 10, min: 'original', max: 'original' }
			}
		},
		tooltip: {
			callbacks: {
				label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
					`${item.dataset.label}: ${item.formattedValue} ${unit}`
			}
		}
	};

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (selected_year == null || !years.includes(Number(selected_year)))) {
				selected_year = years[0].toString();
			}
		});
	});
	$effect(() => {
		nodes;
		untrack(() => {
			if (nodes.length > 0 && (selected_node == null || !nodes.includes(selected_node))) {
				selected_node = nodes[0];
			}
		});
	});
	$effect(() => {
		carriers;
		untrack(() => {
			if (
				carriers.length > 0 &&
				(selected_carrier == null || !carriers.includes(selected_carrier))
			) {
				selected_carrier = carriers[0];
			}
		});
	});

	$effect(() => {
		selected_solution;
		selected_year;
		selected_node;
		selected_carrier;
		selected_window_size;
		untrack(fetch_data);
	});

	// Set URL parameters
	onMount(() => {
		selected_year = getURLParam('year') || selected_year;
		selected_node = getURLParam('node') || selected_node;
		selected_carrier = getURLParam('car') || selected_carrier;
		selected_window_size = getURLParam('window') || selected_window_size;
	});

	$effect(() => {
		// Triggers
		selected_year;
		selected_node;
		selected_carrier;
		selected_window_size;

		tick().then(() => {
			updateURLParams({
				year: selected_year,
				node: selected_node,
				car: selected_carrier,
				window: selected_window_size
			});
		});
	});

	let window_size = $derived(
		{
			Daily: 24,
			Weekly: 168,
			Monthly: 720
		}[selected_window_size] || 1 // Default to hourly (1 hour)
	);

	async function fetch_data() {
		if (
			selected_node == null ||
			selected_carrier == null ||
			selected_year == null ||
			selected_solution == null
		) {
			return;
		}

		fetching = true;

		// Fetch the energy balance data
		[energy_balance_data, unit_data] = await Promise.all([
			get_energy_balance(
				selected_solution.solution_name,
				selected_node,
				selected_carrier,
				selected_solution.scenario_name,
				Number(selected_year),
				window_size
			),
			get_unit(
				selected_solution.solution_name,
				get_variable_name('flow_export', selected_solution.version),
				selected_solution.scenario_name
			)
		]);

		fetching = false;
		update_datasets();
	}

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: number_of_time_steps }, (_, i) => i.toString());
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = [];
	let duals_datasets: ChartDataset<'bar' | 'line'>[] = [];
	let datasets_length: number = $state(0);
	let duals_datasets_length: number = $state(0);
	let number_of_time_steps: number = $state(0);

	function compute_datasets(): ChartDataset<'bar' | 'line'>[] {
		if (
			!selected_solution ||
			!selected_node ||
			!selected_carrier ||
			!selected_year ||
			!energy_balance_data
		) {
			return [];
		}

		return Object.entries(energy_balance_data).flatMap(([key, entries]: [string, Entry[]]) => {
			if (!entries || entries.length === 0 || key === 'constraint_nodal_energy_balance') {
				return [];
			}

			// for (const plot_name in energy_balance_data) {
			let dataset_selector: Record<string, string[]> = {
				node: [selected_node!]
			};

			// If the dataframe has a row "technology", add all of them to the list of technologies
			if ('technology' in entries[0].index) {
				dataset_selector = {
					technology: entries.map((row: any) => row.index.technology)
				};
			}

			// Filter and group rows by label (technology/node/label)
			const filtered = entries.filter((entry: Entry) =>
				Object.entries(dataset_selector).every(([k, v]) => v.includes(entry.index[k]))
			);

			// Group by label (technology/node/label)
			const aggregated_map: Record<string, number[]> = {};
			filtered.forEach((entry: Entry) => {
				const label = entry.index.technology || entry.index.node || entry.index.label || '';
				if (!aggregated_map[label]) {
					aggregated_map[label] = new Array(entry.data.length).fill(0);
				}
				entry.data.forEach((value, index) => {
					aggregated_map[label][index] += value;
				});
			});

			// Loop through the different variables
			return Object.entries(aggregated_map)
				.map(([label, data]) => {
					if (Object.keys(data).length == 0) {
						return null;
					}

					// Get label-name for the plot
					const version = selected_solution!.version;
					const labelMap: Record<string, (label: string) => string> = {
						[get_variable_name('flow_storage_discharge', version)]: (l) => l + ' (discharge)',
						[get_variable_name('flow_transport_in', version)]: (l) => l + ' (transport in)',
						[get_variable_name('flow_import', version)]: () => 'Import',
						[get_variable_name('shed_demand', version)]: () => 'Shed Demand',
						[get_variable_name('flow_storage_charge', version)]: (l) => l + ' (charge)',
						[get_variable_name('flow_transport_out', version)]: (l) => l + ' (transport out)',
						[get_variable_name('flow_export', version)]: () => 'Export'
					};

					// Demand is plotted in a different way than the other plots
					let color = nextColor();
					let bg_color = color;
					let dataset_data = Object.values(data).map((value, i) => ({ x: i, y: value }));

					if (key == 'demand') {
						return {
							data: dataset_data,
							label: 'Demand',
							type: 'line',
							stack: 'ownCustomStack',
							fill: false,
							borderColor: 'black',
							backgroundColor: 'white',
							borderWidth: 2,
							stepped: true,
							pointRadius: Object.keys(data).length == 1 ? 2 : 0
						} as ChartDataset<'bar' | 'line'>;
					} else {
						return {
							data: dataset_data,
							label: labelMap[key]?.(label) || label,
							fill: 'origin',
							borderColor: color,
							backgroundColor: bg_color,
							stepped: true,
							cubicInterpolationMode: 'monotone',
							pointRadius: Object.keys(data).length == 1 ? 2 : 0
						} as ChartDataset<'bar' | 'line'>;
					}
				})
				.filter((dataset) => dataset !== null);
		});
	}

	function compute_duals_datasets() {
		if (
			!selected_solution ||
			!selected_node ||
			!selected_carrier ||
			!selected_year ||
			!energy_balance_data
		) {
			return [];
		}

		const duals_key = 'constraint_nodal_energy_balance';
		const entries = energy_balance_data[duals_key];

		if (!entries || entries.length === 0) {
			return [];
		}

		// Loop through the different variables
		return entries
			.map((entry) => {
				if (entry.data.length == 0) {
					return null;
				}

				let dataset_data = entry.data.map((value, i) => ({ x: i, y: value }));

				return {
					data: dataset_data,
					label: `dual_${entry.index.carrier}_${entry.index.node}`,
					fill: false,
					borderColor: 'rgb(0, 0, 0)',
					backgroundColor: 'rgb(0, 0, 0)',
					borderWidth: 2,
					stepped: true,
					cubicInterpolationMode: 'monotone',
					pointRadius: entry.data.length == 1 ? 2 : 0
				} as ChartDataset<'bar' | 'line'>;
			})
			.filter((dataset) => dataset !== null);
	}

	async function update_datasets() {
		reset_color_picker_state();
		datasets = compute_datasets();
		datasets_length = datasets.length;
		number_of_time_steps = datasets_length > 0 ? datasets[0].data.length : 0;
		duals_datasets = compute_duals_datasets();
		duals_datasets_length = duals_datasets.length;

		await tick();

		if (plot) {
			plot.updateChart(datasets);
		}
		if (duals_plot) {
			duals_plot.updateChart(duals_datasets);
		}
	}
</script>

<h1 class="mt-2 mb-4">The Energy Balance &ndash; Nodal</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:carriers
			bind:nodes
			bind:years
			bind:loading={solution_loading}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Data Selection">
			<FilterRow label="Year">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={toOptions(years.map((year) => year.toString()))}
						bind:value={selected_year}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Node">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={toOptions(nodes)}
						bind:value={selected_node}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Carrier">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={toOptions(carriers)}
						bind:value={selected_carrier}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Smoothing Window Size">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={window_sizes}
						bind:value={selected_window_size}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
		</FilterSection>
	{/if}
</Filters>
<div class="my-4">
	{#if fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if datasets_length == 0 || selected_solution == null}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<Chart
			type={number_of_time_steps == 1 ? 'bar' : 'line'}
			{labels}
			datasets={[]}
			options={plot_options}
			pluginOptions={plotPluginOptions}
			plotName={plot_name}
			zoom={true}
			bind:zoomLevel
			bind:this={plot}
		></Chart>
		{#if duals_datasets_length > 0}
			<Chart
				id="chart-duals"
				type={number_of_time_steps == 1 ? 'bar' : 'line'}
				{labels}
				datasets={[]}
				options={duals_plot_options}
				pluginOptions={plotPluginOptions}
				plotName={duals_plot_name}
				zoom={true}
				narrow
				generateLabels={() => []}
				bind:zoomLevel
				bind:this={duals_plot}
			></Chart>
		{:else}
			<div class="text-center text-muted mt-2">No dual data available.</div>
		{/if}
	{/if}
</div>
