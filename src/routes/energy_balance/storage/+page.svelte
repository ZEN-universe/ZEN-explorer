<script lang="ts">
	import {
		type Chart,
		type ChartDataset,
		type ChartOptions,
		type ChartType,
		type ChartTypeRegistry,
		type TooltipItem
	} from 'chart.js';
	import { onMount, tick, untrack } from 'svelte';

	import ToggleButton from '$components/ToggleButton.svelte';
	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_full_ts } from '$lib/temple';
	import { remove_duplicates, to_options } from '$lib/utils';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';
	import type { ActivatedSolution, TimeSeriesEntry } from '$lib/types';
	import { add_transparency, next_color, reset_color_state } from '$lib/colors';

	// All but one data variable are non-reactive because of their size
	let level_response: TimeSeriesEntry[] | null = null;
	let charge_response: TimeSeriesEntry[] | null = null;
	let discharge_response: TimeSeriesEntry[] | null = null;
	let spillage_response: TimeSeriesEntry[] | null = null;
	let inflow_response: TimeSeriesEntry[] | null = null;
	let response_update_trigger: number = $state(0);
	let units: { [carrier: string]: string } = $state({});

	let years: number[] = $state([]);
	const window_sizes: string[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let selected_year: string = $state('');
	let selected_window_size: string = $state('Hourly');
	let selected_subdivision: boolean = $state(true);
	let selected_technologies: string[] = $state([]);
	let selected_locations: string[] = $state([]);

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let level_plot = $state<BarPlot>();
	let flow_plot = $state<BarPlot>();

	let unit: string = $derived.by(() => (technologies.length > 0 ? units[technologies[0]] : ''));
	let plot_name: string = $derived.by(() => {
		if (!selected_solution || !selected_solution.solution_name) {
			return '';
		}
		let solution_names = selected_solution.solution_name.split('.');
		return [
			solution_names[solution_names.length - 1],
			selected_solution.scenario_name,
			'storage_level',
			selected_carrier
		].join('_');
	});
	let plot_name_flows: string = $derived(plot_name + '_flows');
	let plot_options: ChartOptions<'line'> = $derived(
		get_options('Storage Level', (event) =>
			flow_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max)
		)
	);
	let plot_options_flows: ChartOptions<'line'> = $derived(
		get_options('Storage Flow', (event) =>
			level_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max)
		)
	);

	function get_options(
		label: string,
		on_zoom: (event: { chart: Chart }) => void
	): ChartOptions<'line'> {
		return {
			animation: false,
			normalized: true,
			parsing: false,
			elements: {
				point: {
					radius: 0
				},
				line: {
					borderWidth: 1
				}
			},
			responsive: true,
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
					max: selected_solution?.detail?.system.total_hours_per_year
				},
				y: {
					stacked: true,
					beginAtZero: true,
					title: {
						display: true,
						text: `${label} [${unit}]`
					}
				}
			},
			plugins: {
				zoom: {
					pan: {
						enabled: true,
						modifierKey: 'ctrl',
						mode: 'x',
						onPanComplete: on_zoom
					},
					zoom: {
						drag: {
							enabled: true
						},
						wheel: {
							enabled: true
						},
						mode: 'x',
						onZoomComplete: on_zoom
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
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x'
			}
		};
	}

	let locations: string[] = $derived.by(() => {
		response_update_trigger;
		if (!level_response) {
			return [];
		}
		return remove_duplicates(level_response.map((a) => a.index.node)).sort();
	});

	let carriers: string[] = $derived.by(() => {
		response_update_trigger;
		if (!level_response || !selected_solution) {
			return [];
		}
		let all_technologies = Array.from(level_response.map((a) => a.index.technology));
		return remove_duplicates(
			level_response
				.filter((element) => all_technologies.includes(element.index.technology))
				.map((element) => selected_solution!.detail.reference_carrier[element.index.technology])
		);
	});

	let technologies: string[] = $derived.by(() => {
		response_update_trigger;
		if (!level_response || !selected_solution || carriers.length === 0) {
			return [];
		}
		let all_technologies = remove_duplicates(level_response.map((a) => a.index.technology));
		return all_technologies.filter(
			(technology) => selected_solution!.detail.reference_carrier[technology] == selected_carrier
		);
	});

	$effect(() => {
		technologies;
		untrack(() => {
			selected_technologies = technologies;
		});
	});

	$effect(() => {
		locations;
		untrack(() => {
			selected_locations = locations;
		});
	});

	$effect(() => {
		carriers;
		untrack(() => {
			if (carriers.length > 0 && (!selected_carrier || !carriers.includes(selected_carrier))) {
				selected_carrier = carriers[0];
				update_datasets();
			}
		});
	});

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (!selected_year || !years.includes(Number(selected_year)))) {
				selected_year = years[0].toString();
				update_datasets();
			}
		});
	});

	$effect(() => {
		// Triggers
		selected_carrier;
		selected_subdivision;
		selected_technologies;
		selected_locations;
		untrack(update_datasets);
	});

	// Set URL parameters
	onMount(() => {
		selected_carrier = get_url_param('carrier') || selected_carrier;
		selected_year = get_url_param('year') || selected_year;
		selected_window_size = get_url_param('window_size') || selected_window_size;
	});

	$effect(() => {
		// Triggers
		selected_year;
		selected_carrier;
		selected_window_size;

		tick().then(() => {
			update_url_params({
				year: selected_year,
				carrier: selected_carrier,
				window_size: selected_window_size
			});
		});
	});

	$effect(() => {
		fetch_data();
	});

	async function fetch_data() {
		if (selected_solution === null || !selected_year) {
			return;
		}

		fetching = true;

		let window_size =
			{
				Daily: 24,
				Weekly: 168,
				Monthly: 720
			}[selected_window_size] || 1; // Default to hourly (1 hour)

		const response = await get_full_ts(
			selected_solution.solution_name,
			[
				'storage_level',
				'flow_storage_charge',
				'flow_storage_discharge',
				'flow_storage_spillage',
				'flow_storage_inflow'
			],
			selected_solution.scenario_name,
			'storage_level',
			Number(selected_year),
			window_size
		);

		level_response = response.components.storage_level || null;
		charge_response = response.components.flow_storage_charge || null;
		discharge_response = response.components.flow_storage_discharge || null;
		spillage_response = response.components.flow_storage_spillage || null;
		inflow_response = response.components.flow_storage_inflow || null;
		response_update_trigger++;

		if (response.unit?.data) {
			units = Object.fromEntries(response.unit.data.map((u) => [u.technology, u[0] || u.units]));
		}

		fetching = false;
		update_datasets();
	}

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: number_of_time_steps }, (_, i) => i.toString());
	});

	let level_datasets: ChartDataset<'bar' | 'line'>[] = [];
	let flow_datasets: ChartDataset<'bar' | 'line'>[] = [];
	let level_datasets_length: number = $state(0);
	let flow_datasets_length: number = $state(0);
	let number_of_time_steps: number = $state(0);

	function compute_level_datasets() {
		if (
			selected_locations.length == 0 ||
			selected_technologies.length == 0 ||
			!level_response ||
			!charge_response ||
			!discharge_response ||
			!inflow_response ||
			!spillage_response
		) {
			return [];
		}

		return convert_to_dataset(
			level_response,
			{
				technology: selected_technologies,
				node: selected_locations
			},
			selected_subdivision ? ['technology'] : [],
			selected_subdivision
				? undefined
				: () => ({
						label: 'Storage Level',
						borderColor: 'rgb(0, 0, 0)',
						backgroundColor: 'rgba(0, 0, 0, 0.2)'
					})
		);
	}

	function compute_flow_datasets() {
		if (
			selected_solution === null ||
			fetching ||
			selected_locations.length == 0 ||
			selected_technologies.length == 0 ||
			!level_response ||
			!charge_response ||
			!discharge_response ||
			!inflow_response ||
			!spillage_response
		) {
			return [];
		}

		return [
			{
				data: charge_response,
				label_suffix: '_charge',
				label_aggregated: 'Flow Storage Charge',
				negate: false,
				color: 'rgb(54, 162, 235)'
			},
			{
				data: discharge_response,
				label_suffix: '_discharge',
				label_aggregated: 'Flow Storage Discharge',
				negate: true,
				color: 'rgb(255, 99, 132)'
			},
			{
				data: inflow_response,
				label_suffix: '_inflow',
				label_aggregated: 'Flow Storage Inflow',
				negate: false,
				color: 'rgb(75, 192, 192)'
			},
			{
				data: spillage_response,
				label_suffix: '_spillage',
				label_aggregated: 'Flow Storage Spillage',
				negate: true,
				color: 'rgb(255, 99, 132)'
			}
		].flatMap(({ data, label_suffix, label_aggregated, negate, color }) => {
			return convert_to_dataset(
				data,
				{
					technology: selected_technologies,
					node: selected_locations
				},
				selected_subdivision ? ['technology'] : [],
				selected_subdivision
					? (entry) => ({ label: entry.index.column + label_suffix })
					: () => ({ label: label_aggregated, borderColor: color, backgroundColor: color }),
				(value) => (negate ? -value : value)
			);
		});
	}

	/**
	 * Update the datasets for the charts.
	 * This function is called when any data or filters change.
	 * We do this because Svelte's reactivity does not work well with large datasets.
	 */
	async function update_datasets() {
		reset_color_state();
		level_datasets = compute_level_datasets();
		flow_datasets = compute_flow_datasets();
		level_datasets_length = level_datasets.length;
		flow_datasets_length = flow_datasets.length;
		number_of_time_steps = level_datasets_length > 0 ? level_datasets[0].data.length : 0;

		await tick();

		if (level_plot) {
			level_plot.updateChart(level_datasets);
		}
		if (flow_plot) {
			flow_plot.updateChart(flow_datasets);
		}
	}

	/**
	 * Convert time series data to a chart dataset.
	 *
	 * @param initial_entries The initial time series entries.
	 * @param selectors The selectors to filter the data.
	 * @param groupByAttributes The attributes to group by.
	 * @param buildDatasetBase A function to build the base dataset properties.
	 * @param mapData A function to map the data values.
	 */
	function convert_to_dataset(
		initial_entries: TimeSeriesEntry[],
		selectors: { [key: string]: string[] },
		groupByAttributes: string[] | null,
		buildDatasetBase: (entry: TimeSeriesEntry) => Partial<ChartDataset<'line'>> = () => ({}),
		mapData: (value: number, i: number, array: number[]) => number = (value) => value
	): ChartDataset<'bar' | 'line'>[] {
		let entries = initial_entries
			.filter((entry) => {
				// Filter out all entries that do not contain at least one selector
				return Object.entries(selectors).every(([key, values]) => {
					return values.includes(entry.index[key]);
				});
			})
			.map((entry) => {
				// Apply mapping function to each data point
				return {
					index: entry.index,
					data: entry.data.map(mapData)
				};
			});

		if (entries.length === 0) {
			return [];
		}

		if (groupByAttributes) {
			// Group by the specified attributes
			const aggregated_columns = Array.isArray(groupByAttributes) ? groupByAttributes : [0];
			const aggregated_map: { [key: string]: number[] } = {};

			entries.forEach((entry) => {
				// Compute label of aggregated entry, initialize it, and compute total for each column
				const label = aggregated_columns.map((column) => entry.index[column]).join('_');
				if (!aggregated_map[label]) {
					aggregated_map[label] = new Array(entry.data.length).fill(0);
				}
				entry.data.forEach((value, i) => {
					aggregated_map[label][i] += value;
				});
			});

			// Create aggregated entries
			entries = Object.entries(aggregated_map).map(([column, data]) => {
				return {
					index: { column },
					data: data
				} as TimeSeriesEntry;
			});
		}

		// Map entries to datasets
		return entries.map((entry) => {
			const datasetBase = buildDatasetBase(entry);
			const color = datasetBase.borderColor || next_color();

			return {
				...datasetBase,
				data: entry.data.map((value, i) => ({ x: i, y: value })),
				label: datasetBase.label || entry.index.column,
				type: 'line',
				fill: 'origin',
				stepped: true,
				borderColor: color,
				backgroundColor: datasetBase.backgroundColor || add_transparency(color as string)
			};
		});
	}
</script>

<h1 class="mt-2 mb-4">The Energy Balance &ndash; Storage</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:loading={solution_loading}
			bind:years
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if selected_solution}
		<FilterSection title="Variable Selection">
			<FilterRow label="Year">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(years.map((year) => year.toString()))}
						bind:value={selected_year}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Carrier">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(carriers)}
						bind:value={selected_carrier}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Smoothing Window Size">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(window_sizes)}
						bind:value={selected_window_size}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
		</FilterSection>
		{#if selected_carrier && locations.length > 0}
			<FilterSection title="Data Selection">
				<FilterRow label="Technology Subdivision">
					{#snippet content(formId)}
						<ToggleButton {formId} bind:value={selected_subdivision}></ToggleButton>
					{/snippet}
				</FilterRow>
				<AllCheckbox label="Technologies" elements={technologies} bind:value={selected_technologies}
				></AllCheckbox>
				<AllCheckbox label="Nodes" elements={locations} bind:value={selected_locations}
				></AllCheckbox>
			</FilterSection>
		{/if}
	{/if}
</Filters>
<div class="mt-4 plot">
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
	{:else if locations.length == 0}
		<div class="text-center">No locations with this selection.</div>
	{:else if level_datasets_length == 0}
		<div class="text-center">No data available for this selection.</div>
		<!-- {:else if flow_datasets_length == 0}
		<div class="text-center">No flow data available for this selection.</div> -->
	{:else}
		<BarPlot
			id="level_chart"
			type="line"
			{labels}
			datasets={[]}
			options={plot_options}
			{plot_name}
			zoom={true}
			bind:this={level_plot}
		></BarPlot>
		<BarPlot
			id="flow_chart"
			type="line"
			{labels}
			datasets={[]}
			options={plot_options_flows}
			plot_name={plot_name_flows}
			zoom={true}
			bind:this={flow_plot}
		></BarPlot>
	{/if}
</div>
