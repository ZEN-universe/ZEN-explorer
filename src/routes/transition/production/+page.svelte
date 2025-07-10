<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ParseResult } from 'papaparse';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_component_total } from '$lib/temple';
	import { get_variable_name } from '$lib/variables';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import { get_url_param, update_url_params, type URLParams } from '$lib/url_params.svelte';
	import type { ActivatedSolution, Dataset, Row } from '$lib/types';
	import { reset_color_state } from '$lib/colors';

	// Data
	let data: (ParseResult<any> | null)[] | null = $state(null);
	let years: number[] = $state([]);
	let nodes: string[] = $state([]);
	let edges: string[] = $state([]);

	// Variables
	interface Variable {
		id: string;
		title: string;
		show: boolean;
		subdivision: boolean;
		show_subdivision: boolean;
		filter_by_technologies: boolean;
		positive: string;
		positive_label: string;
		positive_suffix?: string;
		negative: string;
		negative_label: string;
		negative_suffix?: string;
	}
	let variables: Variable[] = $state([
		{
			id: 'conversion',
			title: 'Conversion',
			show: true,
			subdivision: false,
			show_subdivision: true,
			filter_by_technologies: true,
			positive: 'flow_conversion_output',
			positive_label: 'Conversion output',
			negative: 'flow_conversion_input',
			negative_label: 'Conversion input'
		},
		{
			id: 'storage',
			title: 'Storage',
			show: true,
			subdivision: false,
			show_subdivision: true,
			filter_by_technologies: true,
			positive: 'flow_storage_discharge',
			positive_label: 'Storage discharge',
			positive_suffix: ' (discharge)',
			negative: 'flow_storage_charge',
			negative_label: 'Storage charge',
			negative_suffix: ' (charge)'
		},
		{
			id: 'import_export',
			title: 'Import/Export',
			show: true,
			subdivision: false,
			show_subdivision: false,
			filter_by_technologies: false,
			positive: 'flow_import',
			positive_label: 'Import',
			negative: 'flow_export',
			negative_label: 'Export'
		},
		{
			id: 'demand_shed_demand',
			title: 'Demand/Shed Demand',
			show: true,
			subdivision: false,
			show_subdivision: false,
			filter_by_technologies: false,
			positive: 'shed_demand',
			positive_label: 'Shed Demand',
			negative: 'demand',
			negative_label: 'Demand'
		}
	]);

	// Selected values
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let selected_conversion_technologies: string[] = $state([]);
	let selected_storage_technologies: string[] = $state([]);
	let selected_technologies = $derived.by(() => [
		...selected_conversion_technologies,
		...selected_storage_technologies
	]);
	let selected_normalisation: boolean = $state(false);
	let selected_nodes: string[] = $state([]);
	let selected_years: number[] = $state([]);

	// First update flags
	let first_conversion_technology_update = $state(true);
	let first_storage_technology_update = $state(true);

	// States
	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plot_name: string = $derived.by(() => {
		if (!selected_solution?.solution_name || !selected_carrier) return '';
		// Define filename of the plot when downloading.
		let solution_names = selected_solution.solution_name.split('.');
		return [
			solution_names[solution_names?.length - 1],
			selected_solution.scenario_name,
			selected_carrier
		].join('_');
	});

	// Units
	let units: Row[] = $state([]);
	let unit = $derived.by(() => {
		let row = null;
		if (!row && selected_carrier) {
			row = units.find((u) => u.carrier == selected_carrier);
		}
		if (!row) return '';
		return row[0] || row.units || '';
	});
	const indexOfDemandResponse = 7;

	// Plot config
	let labels: string[] = $derived(selected_years.map((year) => year.toString()));
	let plot_options: ChartOptions = $derived.by(() => {
		return {
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
						text: `Production [${unit}]`
					}
				}
			},
			plugins: {
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
	});

	// Carriers and technologies
	let carriers: string[] = $derived.by(() => {
		if (!selected_solution) return [];
		return selected_solution.detail.system.set_carriers.slice().sort();
	});

	let conversion_technologies = $derived.by(() => {
		if (!selected_solution) return [];
		return remove_duplicates(
			Object.entries(selected_solution!.detail.carriers_input)
				.concat(Object.entries(selected_solution!.detail.carriers_output))
				.filter((t) => selected_carrier && t[1].includes(selected_carrier))
				.map((t) => t[0])
		);
	});
	let storage_technologies = $derived.by(() => {
		if (!selected_solution) return [];
		return selected_solution.detail.system.set_storage_technologies.filter(
			(t) => selected_solution?.detail.reference_carrier[t] == selected_carrier
		);
	});

	// Update selected values when options change
	$effect(() => {
		carriers;
		untrack(() => {
			if ((carriers.length >= 1 && !selected_carrier) || !carriers.includes(selected_carrier!)) {
				selected_carrier = carriers[0];
			}
		});
	});

	$effect(() => {
		conversion_technologies;
		untrack(() => {
			// If it's the first conversion technology update, only set the selected technologies if they are empty.
			if (first_conversion_technology_update) {
				first_conversion_technology_update = false;
				if (selected_conversion_technologies.length == 0 && conversion_technologies.length > 0) {
					selected_conversion_technologies = conversion_technologies;
				}
			} else if (conversion_technologies.length > 0 || selected_conversion_technologies.some((t) => !conversion_technologies.includes(t))) {
				selected_conversion_technologies = conversion_technologies;
			}
		});
	});

	$effect(() => {
		storage_technologies;
		untrack(() => {
			if (first_storage_technology_update) {
				first_storage_technology_update = false;
				if (selected_storage_technologies.length == 0 && storage_technologies.length > 0) {
					selected_storage_technologies = storage_technologies;
				}
			} else if (storage_technologies.length > 0 || selected_storage_technologies.some((t) => !storage_technologies.includes(t))) {
				selected_storage_technologies = storage_technologies;
			}
		});
	});

	$effect(() => {
		selected_nodes = nodes;
	});

	// Store parts of the selected variables in the URL
	onMount(() => {
		selected_carrier = get_url_param('carrier') || null;
		variables.forEach((variable) => {
			let show = get_url_param(variable.id + '_show');
			let subdivision = get_url_param(variable.id + '_subdivision');
			variable.show = show !== null ? show === 'true' : variable.show;
			variable.subdivision = subdivision !== null ? subdivision === 'true' : variable.subdivision;
		});
		selected_conversion_technologies = get_url_param('conversion_technologies')?.split(',') || [];
		first_conversion_technology_update = true;
		selected_storage_technologies = get_url_param('storage_technologies')?.split(',') || [];
		first_conversion_technology_update = true;
	});

	$effect(() => {
		// Triggers
		selected_carrier;
		variables.forEach((variable) => {
			variable.show;
			variable.subdivision;
		});
		selected_conversion_technologies;
		selected_storage_technologies;

		// Wait for router to be initialized
		tick().then(() => {
			let params: URLParams = {
				carrier: selected_carrier,
				conversion_technologies: selected_conversion_technologies.join(','),
				storage_technologies: selected_storage_technologies.join(',')
			};
			variables.forEach((variable) => {
				params[variable.id + '_show'] = variable.show ? 'true' : 'false';
				params[variable.id + '_subdivision'] = variable.subdivision ? 'true' : 'false';
			});
			update_url_params(params);
		});
	});

	// Update functions
	function reset_data_selection() {
		selected_years = years;
		selected_nodes = nodes;
	}

	async function on_solution_changed() {
		reset_data_selection();
		await fetch_data();
	}

	/**
	 * Fetch data from the API server for the current selection.
	 */
	async function fetch_data() {
		if (selected_solution === null) {
			return;
		}

		fetching = true;
		data = null;

		const responses = await Promise.all(
			variables.flatMap((variable) => {
				return [
					get_component_total(
						selected_solution!.solution_name,
						get_variable_name(variable.positive, selected_solution?.version),
						selected_solution!.scenario_name,
						selected_solution!.detail.system.reference_year,
						selected_solution!.detail.system.interval_between_years
					),
					get_component_total(
						selected_solution!.solution_name,
						get_variable_name(variable.negative, selected_solution?.version),
						selected_solution!.scenario_name,
						selected_solution!.detail.system.reference_year,
						selected_solution!.detail.system.interval_between_years
					)
				];
			})
		);

		data = responses.map((response) => {
			if (!response || !response.data) return null;
			return response.data;
		});

		if (responses[indexOfDemandResponse]?.unit?.data) {
			units = responses[indexOfDemandResponse].unit.data;
		}

		fetching = false;
	}

	// Process plot data
	function group_data(data: any, variable: any, technologies?: string[]) {
		if (variable.subdivision) {
			return data;
		}

		// Aggregate all data with the same node
		return Object.entries(
			data.reduce(
				(
					acc: { [node: string]: { technology: string; data: { [year: string]: number } } },
					curr: any
				) => {
					const node = curr['node'];
					const technology = curr['technology'];
					if (technologies && !technologies.includes(technology)) {
						return acc;
					}
					let values = Object.fromEntries(
						Object.entries(curr)
							.filter(([key]) => !isNaN(Number(key)))
							.map(([key, value]) => [key, Number(value)])
					);

					acc[node] = acc[node] || { technology: variable.title, data: {} };
					acc[node].data = Object.fromEntries(
						Object.entries(values).map(([key, value]) => {
							return [key, (value || 0) + (acc[node].data[key] || 0)];
						})
					);
					return acc;
				},
				{}
			)
		).map(([node, value]: any) => ({
			...value.data,
			technology: value.technology,
			node: node
		}));
	}

	function process_data(
		data: ParseResult<any> | null,
		variable: Variable,
		excluded_years: number[],
		label: string,
		suffix: string | undefined,
		map_fn?: (d: ChartDataset<'bar' | 'line'>) => ChartDataset<'bar' | 'line'>
	): ChartDataset<'bar'>[] {
		if (data === null) return [];

		let dataset_selector = { technology: [...selected_technologies, variable.title] };
		let datasets_aggregates = { node: selected_nodes };

		const filtered_result = group_data(
			data.data.filter((a) => a.carrier === undefined || a.carrier == selected_carrier),
			variable,
			variable.filter_by_technologies ? selected_technologies : undefined
		);
		let filtered = filter_and_aggregate_data(
			filtered_result,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation,
			undefined,
			suffix || ''
		);
		if (map_fn !== undefined) {
			filtered = filtered.map(map_fn);
		}
		if (!variable.subdivision && filtered.length > 0) {
			filtered[0].label = label;
		}

		return filtered as ChartDataset<'bar'>[];
	}

	let datasets: ChartDataset<'bar'>[] = $derived.by(() => {
		if (selected_nodes.length == 0 || selected_years.length == 0 || !data || data.length == 0) {
			return [];
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		reset_color_state();
		return variables.flatMap((variable, i) => {
			if (!variable.show || !data) {
				return [];
			}

			let filteredPos: ChartDataset<'bar'>[] = process_data(
				data[2 * i],
				variable,
				excluded_years,
				variable.positive_label,
				variable.positive_suffix,
				undefined
			);
			let filteredNeg: ChartDataset<'bar'>[] = process_data(
				data[2 * i + 1],
				variable,
				excluded_years,
				variable.negative_label,
				variable.negative_suffix,
				(d) => {
					return {
						...d,
						data: Object.values(d.data).map((e) => -e!)
					} as ChartDataset<'bar'>;
				}
			);

			return [...filteredPos, ...filteredNeg];
		}) as unknown as ChartDataset<'bar'>[];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Production</h1>
<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:years
			bind:nodes
			bind:edges
			bind:loading={solution_loading}
			solution_selected={on_solution_changed}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Carrier Selection">
			{#if carriers.length > 0}
				<FilterRow label="Carrier">
					{#snippet content(id)}
						<Dropdown
							formId={id}
							options={to_options(carriers)}
							bind:value={selected_carrier}
							disabled={solution_loading || fetching}
						></Dropdown>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
		<FilterSection title="Production Component Selection">
			{#each variables as variable, i}
				<div class="row align-items-baseline">
					<label class="col-6 col-md-3 fw-medium fs-4" for={'variables' + i}>{variable.title}</label
					>
					<div class="col-4 col-md-3">
						<ToggleButton formId={'variables' + i} bind:value={variable.show}></ToggleButton>
					</div>
					{#if variable.show && variable.show_subdivision}
						<label class="col-6 col-md-2 fw-medium fs-5" for={'subdivision' + i}>Subdivision</label>
						<div class="col-4 col-md-2">
							<ToggleButton formId={'subdivision' + i} bind:value={variable.subdivision}
							></ToggleButton>
						</div>
					{/if}
				</div>
			{/each}
		</FilterSection>
		<FilterSection title="Technology Selection">
			<AllCheckbox
				label="Conversion"
				bind:value={selected_conversion_technologies}
				elements={conversion_technologies}
				disabled={solution_loading || fetching}
			></AllCheckbox>
			<AllCheckbox
				label="Storage"
				bind:value={selected_storage_technologies}
				elements={storage_technologies}
				disabled={solution_loading || fetching}
			></AllCheckbox>
		</FilterSection>
		{#if !fetching && selected_carrier != null}
			<FilterSection title="Data Selection">
				<FilterRow label="Normalization">
					{#snippet content(id)}
						<ToggleButton formId={id} bind:value={selected_normalisation}></ToggleButton>
					{/snippet}
				</FilterRow>
				<AllCheckbox
					label="Nodes"
					bind:value={selected_nodes}
					elements={nodes}
					disabled={solution_loading || fetching}
				></AllCheckbox>
				<AllCheckbox
					label="Years"
					bind:value={selected_years}
					elements={years}
					disabled={solution_loading || fetching}
				></AllCheckbox>
			</FilterSection>
		{/if}
	{/if}
</Filters>
<div class="plot mt-4">
	{#if solution_loading || fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if selected_solution == null}
		<div></div>
	{:else if carriers.length == 0}
		<div class="text-center">No carriers with this selection.</div>
	{:else if datasets.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot type="bar" options={plot_options} {labels} {datasets} {plot_name}></BarPlot>
	{/if}
</div>
