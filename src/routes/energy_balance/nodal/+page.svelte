<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_energy_balance, get_unit } from '$lib/temple';
	import { filter_and_aggregate_data, to_options } from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import { next_color, reset_color_state as reset_color_picker_state } from '$lib/colors';
	import type { ActivatedSolution, EnergyBalanceDataframes } from '$lib/types';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';

	let energy_balance_data: EnergyBalanceDataframes | null = $state(null);
	let unit_data: any = $state(null);
	let solution_loading: boolean = $state(false);
	let fetching = $state(false);

	let nodes: string[] = $state([]);
	let carriers: string[] = $state([]);
	let years: number[] = $state([]);
	const window_sizes = to_options(['Hourly', 'Daily', 'Weekly', 'Monthly']);

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
	const plot_options: ChartOptions = $derived({
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
	});

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
		selected_year = get_url_param('year') || selected_year;
		selected_node = get_url_param('node') || selected_node;
		selected_carrier = get_url_param('carrier') || selected_carrier;
		selected_window_size = get_url_param('window_size') || selected_window_size;
	});

	$effect(() => {
		// Triggers
		selected_year;
		selected_node;
		selected_carrier;
		selected_window_size;

		tick().then(() => {
			update_url_params({
				year: selected_year,
				node: selected_node,
				carrier: selected_carrier,
				window_size: selected_window_size
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

		// Calculate index of year
		let year_index = Math.floor(
			(Number(selected_year) - selected_solution.detail.system.reference_year) /
				selected_solution.detail.system.interval_between_years
		);

		// Fetch the energy balance data
		[energy_balance_data, unit_data] = await Promise.all([
			get_energy_balance(
				selected_solution.solution_name,
				selected_node,
				selected_carrier,
				selected_solution.scenario_name,
				year_index,
				window_size
			),
			get_unit(
				selected_solution.solution_name,
				get_variable_name('flow_export', selected_solution.version),
				selected_solution.scenario_name
			)
		]);

		fetching = false;
	}

	let labels: string[] = $derived.by(() => {
		if (datasets.length === 0) {
			return [];
		}
		return Object.keys(datasets[0].data);
	});
	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		if (
			!selected_solution ||
			!selected_node ||
			!selected_carrier ||
			!selected_year ||
			!energy_balance_data
		) {
			return [];
		}

		reset_color_picker_state();
		return Object.entries(energy_balance_data).flatMap(
			([key, data]: [string, ParseResult<any> | undefined]) => {
				if (!data || !data.data || data.data.length === 0) {
					return [];
				}

				// for (const plot_name in energy_balance_data) {
				let dataset_selector: Record<string, string[]> = {
					node: [selected_node!]
				};

				// If the dataframe has a row "technology", add all of them to the list of technologies
				if ('technology' in data.data[0]) {
					dataset_selector = {
						technology: data.data.map((row: any) => row['technology'])
					};
				}

				// Filter and group rows by label (technology/node/label)
				const filtered = data.data.filter((row: any) =>
					Object.entries(dataset_selector).every(([k, v]) => v.includes(row[k]))
				);

				const grouped = filtered.reduce((acc: Record<string, any[]>, row: any) => {
					const label = row.technology || row.node || row.label || '';
					(acc[label] = acc[label] || []).push(row);
					return acc;
				}, {});

				const filtered_data = Object.entries(grouped).map(([label, group]) => ({
					label,
					data: group.reduce((dataObj: Record<string, number>, row: any) => {
						for (const key in row) {
							if (
								!isNaN(Number(row[key])) &&
								!['year', 'technology', 'node', 'label'].includes(key)
							) {
								dataObj[key] = (dataObj[key] || 0) + Number(row[key]);
							}
						}
						return dataObj;
					}, {})
				}));

				// Loop through the different variables
				return filtered_data
					.map((data) => {
						if (Object.keys(data.data).length == 0) {
							return null;
						}

						// Get label-name for the plot
						const version = selected_solution!.version;
						const labelMap = {
							[get_variable_name('flow_storage_discharge', version)]: (label: string) =>
								label + ' (discharge)',
							[get_variable_name('flow_transport_in', version)]: (label: string) =>
								label + ' (transport in)',
							[get_variable_name('flow_import', version)]: () => 'Import',
							[get_variable_name('shed_demand', version)]: () => 'Shed Demand',
							[get_variable_name('flow_storage_charge', version)]: (label: string) =>
								label + ' (charge)',
							[get_variable_name('flow_transport_out', version)]: (label: string) =>
								label + ' (transport out)',
							[get_variable_name('flow_export', version)]: () => 'Export'
						};

						// Demand is plotted in a different way than the other plots
						let color = next_color();
						let bg_color = color;

						if (key == 'demand') {
							return {
								data: Object.values(data.data),
								label: 'Demand',
								type: 'line',
								stack: 'ownCustomStack',
								fill: false,
								borderColor: 'black',
								backgroundColor: 'white',
								borderWidth: 2,
								stepped: true,
								pointRadius: Object.keys(data.data).length == 1 ? 2 : 0
							} as ChartDataset<'line'>;
						} else {
							return {
								data: Object.values(data.data),
								label: labelMap[key]?.(data.label) || data.label,
								fill: 'origin',
								borderColor: color,
								backgroundColor: bg_color,
								stepped: true,
								cubicInterpolationMode: 'monotone',
								pointRadius: Object.keys(data.data).length == 1 ? 2 : 0
							} as ChartDataset<'bar' | 'line'>;
						}
					})
					.filter((dataset) => dataset !== null);
			}
		);
	});
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
						options={to_options(years.map((year) => year.toString()))}
						bind:value={selected_year}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			<FilterRow label="Node">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(nodes)}
						bind:value={selected_node}
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
						options={window_sizes}
						bind:value={selected_window_size}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
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
	{:else if datasets.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot
			type={datasets[0].data.length == 1 ? 'bar' : 'line'}
			options={plot_options}
			{labels}
			{datasets}
			{plot_name}
			zoom={true}
		></BarPlot>
	{/if}
</div>
