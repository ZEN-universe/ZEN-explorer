<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_variable_name } from '$lib/variables';
	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import { get_url_param, update_url_params, type URLParams } from '$lib/url_params.svelte';
	import type { ActivatedSolution } from '$lib/types';

	const combined_name = 'Techology / Carrier';
	const capex_suffix = ' (Capex)';
	const opex_suffix = ' (Opex)';
	const capex_label = 'Capex';
	const opex_label = 'Opex';
	const carrier_label = 'Carrier';
	const shed_demand_label = 'Shed Demand';

	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);
	let years: number[] = $state([]);
	const aggregation_options: string[] = ['Location', combined_name];

	let selected_locations: string[] = $state([]);
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_years: number[] = $state([]);
	let selected_normalization: boolean = false;
	let selected_cost_carriers: string[] = $state([]);
	let selected_demand_carriers: string[] = $state([]);
	let selected_transport_technologies: string[] = $state([]);
	let selected_storage_technologies: string[] = $state([]);
	let selected_conversion_technologies: string[] = $state([]);
	let selected_aggregation: string = $state('Location');

	let fetched_cost_carbon: ParseResult<any> | null = $state(null);
	let fetched_cost_carrier: ParseResult<any> | null = $state(null);
	let fetched_capex: ParseResult<any> | null = $state(null);
	let fetched_opex: ParseResult<any> | null = $state(null);
	let fetched_cost_shed_demand: ParseResult<any> | null = $state(null);
	let units: { [carrier: string]: string } = $state({});

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	interface Variable {
		title: string;
		show: boolean;
		subdivision: boolean;
		show_subdivision: boolean;
		label?: string;
	}
	let variables: { [id: string]: Variable } = $state({
		capex: {
			title: 'Capex',
			show: true,
			subdivision: false,
			show_subdivision: true,
			label: capex_label
		},
		opex: {
			title: 'Opex',
			show: true,
			subdivision: false,
			show_subdivision: true,
			label: opex_label
		},
		carrier: {
			title: 'Carrier',
			show: true,
			subdivision: false,
			show_subdivision: true,
			label: carrier_label
		},
		shed_demand: {
			title: 'Shed Demand',
			show: true,
			subdivision: false,
			show_subdivision: true,
			label: shed_demand_label
		},
		carbon_emission: {
			title: 'Carbon Emissions',
			show: true,
			subdivision: false,
			show_subdivision: false
		}
	});

	// Plot configuration
	let plot_name = $derived.by(() => {
		if (selected_solution == null) {
			return '';
		}
		let solution_names = selected_solution.solution_name.split('.');
		return [
			solution_names[solution_names.length - 1],
			selected_solution.scenario_name,
			'costs'
		].join('_');
	});
	let unit: string = $derived.by(() => {
		if (conversion_technologies.length > 0) {
			return units[conversion_technologies[0]] || '';
		} else if (transport_technologies.length > 0) {
			return units[transport_technologies[0]] || '';
		} else if (storage_technologies.length > 0) {
			return units[storage_technologies[0]] || '';
		}
		return '';
	});
	let plot_options: ChartOptions = $derived({
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
					text: `Costs [${unit}]`
				}
			}
		},
		interaction: {
			intersect: false,
			mode: 'nearest',
			axis: 'x'
		}
	});

	// Technologies, carriers and locations
	let capex_opex_technologies: Set<string> = $derived.by(() => {
		if (!fetched_capex || !fetched_opex) {
			return new Set<string>();
		}
		return new Set([
			...(fetched_capex.data.map((row) => row[combined_name]) || []),
			...(fetched_opex.data.map((row) => row[combined_name]) || [])
		]);
	});

	let transport_technologies: string[] = $derived.by(() => {
		if (selected_solution == null) {
			return [];
		}
		return selected_solution.detail.system.set_transport_technologies.filter((t) =>
			capex_opex_technologies.has(t)
		);
	});
	let conversion_technologies: string[] = $derived.by(() => {
		if (selected_solution == null) {
			return [];
		}
		return selected_solution.detail.system.set_conversion_technologies.filter((t) =>
			capex_opex_technologies.has(t)
		);
	});
	let storage_technologies: string[] = $derived.by(() => {
		if (selected_solution == null) {
			return [];
		}
		return selected_solution.detail.system.set_storage_technologies.filter((t) =>
			capex_opex_technologies.has(t)
		);
	});

	let cost_carriers: string[] = $derived.by(() => {
		if (selected_solution == null || !fetched_cost_carrier?.data) {
			return [];
		}
		return remove_duplicates(fetched_cost_carrier.data.map((row) => row[combined_name]));
	});

	let demand_carriers: string[] = $derived.by(() => {
		if (selected_solution == null || !fetched_cost_shed_demand?.data) {
			return [];
		}
		return remove_duplicates(fetched_cost_shed_demand.data.map((row) => row[combined_name]));
	});

	let locations: string[] = $derived.by(() => {
		if (selected_solution == null) {
			return [];
		}
		return Object.keys(selected_solution!.detail.edges).concat(
			selected_solution!.detail.system.set_nodes
		);
	});

	// Reset selected values when options change
	$effect(() => {
		transport_technologies;
		untrack(() => {
			if (transport_technologies.length > 0 && selected_transport_technologies.length === 0) {
				selected_transport_technologies = transport_technologies;
			}
		});
	});
	$effect(() => {
		conversion_technologies;
		untrack(() => {
			if (conversion_technologies.length > 0 && selected_conversion_technologies.length === 0) {
				selected_conversion_technologies = conversion_technologies;
			}
		});
	});
	$effect(() => {
		storage_technologies;
		untrack(() => {
			if (storage_technologies.length > 0 && selected_storage_technologies.length === 0) {
				selected_storage_technologies = storage_technologies;
			}
		});
	});
	$effect(() => {
		cost_carriers;
		untrack(() => {
			if (cost_carriers.length > 0 && selected_cost_carriers.length === 0) {
				selected_cost_carriers = cost_carriers;
			}
		});
	});
	$effect(() => {
		demand_carriers;
		untrack(() => {
			if (demand_carriers.length > 0 && selected_demand_carriers.length === 0) {
				selected_demand_carriers = demand_carriers;
			}
		});
	});

	$effect(() => {
		selected_locations = locations;
	});
	$effect(() => {
		selected_years = years;
	});

	onMount(() => {
		Object.entries(variables).forEach(([key, variable]) => {
			let show = get_url_param(key + '_show');
			let subdivision = get_url_param(key + '_subdivision');
			variable.show = show !== null ? show === 'true' : variable.show;
			variable.subdivision = subdivision !== null ? subdivision === 'true' : variable.subdivision;
		});
		selected_transport_technologies = get_url_param('transport_technologies')?.split(',') || [];
		selected_conversion_technologies = get_url_param('conversion_technologies')?.split(',') || [];
		selected_storage_technologies = get_url_param('storage_technologies')?.split(',') || [];
		selected_cost_carriers = get_url_param('cost_carriers')?.split(',') || [];
		selected_demand_carriers = get_url_param('demand_carriers')?.split(',') || [];
	});

	$effect(() => {
		// Triggers
		selected_transport_technologies;
		selected_conversion_technologies;
		selected_storage_technologies;
		selected_cost_carriers;
		selected_demand_carriers;
		Object.values(variables).forEach((variable) => {
			variable.show;
			variable.subdivision;
		});

		// Wait for router to be initialized
		tick().then(() => {
			let params: URLParams = {
				transport_technologies: selected_transport_technologies.join(','),
				conversion_technologies: selected_conversion_technologies.join(','),
				storage_technologies: selected_storage_technologies.join(','),
				cost_carriers: selected_cost_carriers.join(','),
				demand_carriers: selected_demand_carriers.join(',')
			};
			Object.entries(variables).forEach(([key, variable]) => {
				params[key + '_show'] = variable.show ? 'true' : 'false';
				params[key + '_subdivision'] = variable.subdivision ? 'true' : 'false';
			});
			update_url_params(params);
		});
	});

	function solution_changed() {
		if (selected_solution == null) {
			return;
		}

		fetch_data();
	}

	function rename_fields(
		papa_result: ParseResult<any> | null,
		fields: string[][]
	): ParseResult<any> | null {
		if (!papa_result || !papa_result.data) return papa_result;
		papa_result.data = papa_result.data.map((row) => {
			return fields.reduce((acc, [old_name, new_name]) => {
				if (!(old_name in row)) return acc;
				const { [old_name]: oldValue, ...rest } = acc;
				return { ...rest, [new_name]: oldValue };
			}, row);
		});
		return papa_result;
	}

	async function fetch_data() {
		if (selected_solution == null) {
			return;
		}
		fetching = true;

		let [
			response_capex,
			response_opex,
			response_cost_carbon,
			response_cost_carrier,
			response_cost_shed_demand
		] = await Promise.all(
			[
				'capex_yearly',
				'opex_yearly',
				'cost_carbon_emissions_total',
				'cost_carrier',
				'cost_shed_demand'
			].map((variable) =>
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name(variable, selected_solution!.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				)
			)
		);

		// "Standardize" all series names
		fetched_capex = rename_fields(response_capex.data, [['technology', combined_name]]);
		fetched_opex = rename_fields(response_opex.data, [['technology', combined_name]]);
		fetched_cost_carbon = response_cost_carbon.data;
		fetched_cost_carrier = rename_fields(response_cost_carrier.data, [
			['node', 'location'],
			['carrier', combined_name]
		]);
		fetched_cost_shed_demand = rename_fields(response_cost_shed_demand.data, [
			['node', 'location'],
			['carrier', combined_name]
		]);

		if (response_capex.unit?.data) {
			units = Object.fromEntries(
				response_capex.unit.data.map((u) => [u.technology, u[0] || u.units])
			);
		}

		fetching = false;
	}

	let datasets: ChartDataset<'line' | 'bar'>[] = $derived.by(() => {
		let all_selected_carriers_technologies = [
			...selected_conversion_technologies
				.concat(selected_storage_technologies)
				.concat(selected_transport_technologies)
				.flatMap((i) => [i + capex_suffix, i + opex_suffix]),
			...selected_cost_carriers,
			...selected_demand_carriers
		];

		// Update the dataset aggregations and groupings
		const variableToDataMap = [
			{
				key: 'capex',
				data: (fetched_capex?.data || []).map((item) => {
					return {
						...item,
						[combined_name]: item[combined_name] + capex_suffix
					};
				})
			},
			{
				key: 'opex',
				data: (fetched_opex?.data || []).map((item) => {
					return {
						...item,
						[combined_name]: item[combined_name] + opex_suffix
					};
				})
			},
			{
				key: 'carrier',
				data: (fetched_cost_carrier?.data || []).filter((i) =>
					selected_cost_carriers.includes(i[combined_name])
				)
			},
			{
				key: 'shed_demand',
				data:
					(fetched_cost_shed_demand?.data || []).filter((i) =>
						selected_demand_carriers.includes(i[combined_name])
					) || null
			}
		];
		let grouped_data = variableToDataMap.flatMap(({ key, data }) => {
			if (!variables[key].show || !data) {
				return [];
			}

			if (variables[key].subdivision) {
				return data;
			}

			return filter_and_aggregate_data(
				data,
				{ location: selected_locations },
				{ [combined_name]: all_selected_carriers_technologies },
				[],
				false
			).map((item: { label: string; data: any; type: string }) => {
				item.data['location'] = item.label;
				item.data[combined_name] = variables[key].label;
				return item.data;
			});
		});

		variableToDataMap.forEach(({ key }) => {
			if (!variables[key].label) {
				return;
			}
			all_selected_carriers_technologies.push(variables[key].label);
		});

		// Specify Aggregation. If the aggregation type is location, all technologies have to be aggregated and vice versa.
		let dataset_selector: { [key: string]: string[] };
		let datasets_aggregates: { [key: string]: string[] };
		if (selected_aggregation == combined_name) {
			dataset_selector = { location: locations };
			datasets_aggregates = { [combined_name]: all_selected_carriers_technologies };
		} else {
			dataset_selector = { [combined_name]: all_selected_carriers_technologies };
			datasets_aggregates = { location: selected_locations };
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		// Get plot data, as a base we take the grouped data adapted to the cost selection.
		let bar_data: ChartDataset<'bar'>[] = filter_and_aggregate_data(
			grouped_data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		) as unknown as ChartDataset<'bar'>[];

		// Get total carbon cost data
		let line_data: ChartDataset<'line'>[] = [];
		if (
			fetched_cost_carbon?.data &&
			fetched_cost_carbon.data.length > 0 &&
			variables.carbon_emission.show
		) {
			line_data = [
				{
					label: 'Total Carbon Costs',
					data: fetched_cost_carbon.data[0],
					type: 'bar'
				}
			] as unknown as ChartDataset<'line'>[];
		}

		return [...bar_data, ...line_data];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Costs</h1>

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
	{#if !fetching && !solution_loading && fetched_capex && selected_solution != null}
		<FilterSection title="Cost Selection">
			{#each Object.values(variables) as variable, i}
				<div class="row mb-2">
					<label class="col-6 col-md-3 fw-medium fs-4" for={'variables' + i}>
						{variable.title}
					</label>
					<div class="col-4 col-md-2">
						<ToggleButton formId={'variables' + i} bind:value={variable.show}></ToggleButton>
					</div>
					{#if variable.show && variable.show_subdivision}
						<label class="col-6 col-md-2" for={'subdivision' + i}>Subdivision</label>
						<div class="col-4 col-md-2">
							<ToggleButton formId={'subdivision' + i} bind:value={variable.subdivision}
							></ToggleButton>
						</div>
					{/if}
				</div>
			{/each}
		</FilterSection>
		<FilterSection title="Technology Selection">
			<h3>Technologies (for Capex/Opex)</h3>
			{#if transport_technologies.length > 0}
				<AllCheckbox
					label="Transport"
					bind:value={selected_transport_technologies}
					elements={transport_technologies}
				></AllCheckbox>
			{/if}
			{#if storage_technologies.length > 0}
				<AllCheckbox
					label="Storage"
					bind:value={selected_storage_technologies}
					elements={storage_technologies}
				></AllCheckbox>
			{/if}
			{#if conversion_technologies.length > 0}
				<AllCheckbox
					label="Conversion"
					bind:value={selected_conversion_technologies}
					elements={conversion_technologies}
				></AllCheckbox>
			{/if}
			{#if cost_carriers.length > 0}
				<AllCheckbox
					label="Cost of Carrier"
					bind:value={selected_cost_carriers}
					elements={cost_carriers}
				></AllCheckbox>
			{/if}
			{#if demand_carriers.length > 0}
				<AllCheckbox
					label="Shed Demand"
					bind:value={selected_demand_carriers}
					elements={demand_carriers}
				></AllCheckbox>
			{/if}
		</FilterSection>
		<FilterSection title="Data Selection">
			<FilterRow label="Aggregation">
				{#snippet content(formId)}
					<Radio
						{formId}
						options={to_options(aggregation_options)}
						bind:value={selected_aggregation}
					></Radio>
				{/snippet}
			</FilterRow>
			{#if selected_aggregation == aggregation_options[1]}
				<AllCheckbox label="Location" bind:value={selected_locations} elements={locations}
				></AllCheckbox>
			{/if}
			{#if selected_years}
				<AllCheckbox label="Year" bind:value={selected_years} elements={years}></AllCheckbox>
			{/if}
		</FilterSection>
	{/if}
</Filters>
<div class="mt-4">
	{#if solution_loading || fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if selected_solution != null}
		{#if datasets.length == 0 || datasets[0].data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else if selected_years.length == 0}
			<div class="text-center">Please select at least one year.</div>
		{:else}
			<BarPlot type="line" options={plot_options} {datasets} {plot_name}></BarPlot>
		{/if}
	{/if}
</div>
