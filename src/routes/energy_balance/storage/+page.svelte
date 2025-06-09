<script lang="ts">
	import type { Chart, ChartDataset, ChartOptions } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import ToggleButton from '$components/ToggleButton.svelte';
	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';

	import { get_full_ts } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import type { ActivatedSolution, ComponentTotal, Row } from '$lib/types';
	import FilterRow from '$components/FilterRow.svelte';
	import { onMount, tick, untrack } from 'svelte';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';

	let levelResponse: ComponentTotal | null = $state(null);
	let chargeResponse: ComponentTotal | null = $state(null);
	let dischargeResponse: ComponentTotal | null = $state(null);
	let spillageResponse: ComponentTotal | null = $state(null);
	let inflowResponse: ComponentTotal | null = $state(null);
	let units: { [carrier: string]: string } = $state({});

	let years: number[] = $state([]);
	const window_sizes: string[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let selected_locations: string[] = $state([]);
	let selected_subdivision: boolean = $state(true);
	let selected_year: string = $state('');
	let selected_window_size: string = $state('Hourly');

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
	let plot_options: ChartOptions = $derived(
		get_options('Storage Level', (event) =>
			flow_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max)
		)
	);
	let plot_options_flows: ChartOptions = $derived(
		get_options('Storage Flow', (event) =>
			level_plot?.zoom_rect(event.chart.scales.x.min, event.chart.scales.x.max)
		)
	);

	function get_options(
		label: string,
		on_zoom: (event: { chart: Chart }) => void
	): ChartOptions<'bar'> {
		return {
			animation: false,
			normalized: true,
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
						x: { minRange: 10 }
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
		if (!levelResponse?.data) {
			return [];
		}
		return remove_duplicates(levelResponse.data.data.map((a) => a.node));
	});

	let carriers: string[] = $derived.by(() => {
		if (!levelResponse?.data || !selected_solution) {
			return [];
		}
		let all_technologies = Array.from(levelResponse.data.data.map((a) => a.technology));
		return remove_duplicates(
			levelResponse.data.data
				.filter((element) => all_technologies.includes(element.technology))
				.map((element) => selected_solution!.detail.reference_carrier[element.technology])
		);
	});

	let technologies: string[] = $derived.by(() => {
		if (!levelResponse?.data || !selected_solution || carriers.length === 0) {
			return [];
		}
		let all_technologies = remove_duplicates(levelResponse.data.data.map((a: any) => a.technology));
		return all_technologies.filter(
			(technology) => selected_solution!.detail.reference_carrier[technology] == selected_carrier
		);
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
				selected_carrier = carriers[0]
			}
		});
	});

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (!selected_year || !years.includes(Number(selected_year)))) {
				selected_year = years[0].toString();
			}
		});
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

		// Calculate index of year
		let year_index = Math.floor(
			(Number(selected_year) - selected_solution.detail.system.reference_year) /
				selected_solution.detail.system.interval_between_years
		);
		let window_size =
			{
				Daily: 24,
				Weekly: 168,
				Monthly: 720
			}[selected_window_size] || 1; // Default to hourly (1 hour)

		[levelResponse, chargeResponse, dischargeResponse, spillageResponse, inflowResponse] =
			await Promise.all(
				[
					'storage_level',
					'flow_storage_charge',
					'flow_storage_discharge',
					'flow_storage_spillage',
					'flow_storage_inflow'
				].map((variable) => {
					return get_full_ts(
						selected_solution!.solution_name,
						get_variable_name(variable, selected_solution!.version),
						selected_solution!.scenario_name,
						year_index,
						window_size
					);
				})
			);

		if (levelResponse.unit?.data) {
			units = Object.fromEntries(
				levelResponse.unit.data.map((u) => [u.technology, u[0] || u.units])
			);
		}

		fetching = false;
	}

	let labels: string[] = $derived.by(() => {
		if (datasets.length === 0) {
			return [];
		}
		return Object.keys(datasets[0].data);
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		console.log('Computing datasets');

		if (
			selected_locations.length == 0 ||
			technologies.length == 0 ||
			!levelResponse?.data ||
			!chargeResponse?.data ||
			!dischargeResponse?.data ||
			!inflowResponse?.data ||
			!spillageResponse?.data
		) {
			return [];
		}

		let dataset_selector = { technology: technologies };
		let datasets_aggregates = { node: selected_locations };

		let filtered_data = filter_and_aggregate_data(
			levelResponse.data.data,
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

		if (selected_subdivision) {
			return filtered_data as unknown as ChartDataset<'bar' | 'line'>[];
		}

		let new_data: { [key: string]: number } = {};
		for (const i in filtered_data[0].data) {
			new_data[i] = filtered_data
				.map((j) => j.data[i])
				.reduce((partialSum, a) => partialSum + a, 0);
		}

		return [
			{
				data: Object.values(new_data),
				label: 'Storage level',
				type: 'line',
				borderColor: 'black',
				fill: 'origin',
				stepped: true
			}
		] as unknown as ChartDataset<'bar' | 'line'>[];
	});

	let flow_datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		console.log('Computing flow datasets');

		if (
			selected_locations.length == 0 ||
			technologies.length == 0 ||
			!levelResponse?.data ||
			!chargeResponse?.data ||
			!dischargeResponse?.data ||
			!inflowResponse?.data ||
			!spillageResponse?.data
		) {
			return [];
		}

		let dataset_selector = { technology: technologies };
		let datasets_aggregates = { node: selected_locations };

		let charge_filtered_data = filter_and_aggregate_data(
			chargeResponse.data.data,
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
		let discharge_filtered_data = filter_and_aggregate_data(
			dischargeResponse.data.data,
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
		let spillage_filtered_data = filter_and_aggregate_data(
			spillageResponse.data.data,
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
		let inflow_filtered_data = filter_and_aggregate_data(
			inflowResponse.data.data,
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

		if (selected_subdivision) {
			return charge_filtered_data
				.concat(discharge_filtered_data)
				.concat(inflow_filtered_data)
				.concat(spillage_filtered_data) as unknown as ChartDataset<'bar' | 'line'>[];
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
		for (const i in inflowResponse.data.data[0]) {
			new_inflow[i] = inflowResponse.data.data
				.map((j) => j.data[i])
				.reduce((partialSum, a) => partialSum + a, 0);
		}
		let new_spillage: { [key: string]: number } = {};
		for (const i in spillageResponse.data.data[0]) {
			new_spillage[i] = spillageResponse.data.data
				.map((j) => j.data[i])
				.reduce((partialSum, a) => partialSum + a, 0);
		}

		return [
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
		] as unknown as ChartDataset<'bar' | 'line'>[];
	});
	$inspect('flow_datasets', flow_datasets);
	$inspect('datasets', datasets);
	$inspect('plot_config_flows', plot_options_flows);
</script>

<h2>The Energy Balance Storage</h2>
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
		{#if selected_carrier}
			<FilterSection title="Data Selection">
				<FilterRow label="Technology Subdivision">
					{#snippet content(formId)}
						<ToggleButton {formId} bind:value={selected_subdivision}></ToggleButton>
					{/snippet}
				</FilterRow>
				<AllCheckbox label="Node" elements={locations} bind:value={selected_locations}
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
	{:else if locations.length == 0}
		<div class="text-center">No locations with this selection.</div>
	{:else if datasets.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot
			type="line"
			{labels}
			{datasets}
			options={plot_options}
			{plot_name}
			zoom={true}
			bind:this={level_plot}
		></BarPlot>
		<BarPlot
			type="line"
			{labels}
			datasets={flow_datasets}
			options={plot_options_flows}
			plot_name={plot_name_flows}
			zoom={true}
			bind:this={flow_plot}
		></BarPlot>
	{/if}
</div>
