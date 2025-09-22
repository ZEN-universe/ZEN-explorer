<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import {
		getURLParamAsBoolean,
		getURLParamAsIntArray,
		updateURLParams,
		type URLParams
	} from '$lib/navigationParams.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { reset_color_state } from '$lib/colors';
	import { get_variable_name } from '$lib/variables';

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

	let fetched_cost_carbon: ParseResult<any> | null = $state(null);
	let fetched_cost_carrier: ParseResult<any> | null = $state(null);
	let fetched_capex: ParseResult<any> | null = $state(null);
	let fetched_opex: ParseResult<any> | null = $state(null);
	let fetched_cost_shed_demand: ParseResult<any> | null = $state(null);
	let units: { [carrier: string]: string } = $state({});

	let selected_locations: string[] = $state([]);
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_years: number[] = $state([]);
	let selected_cost_carriers: string[] = $state([]);
	let selected_demand_carriers: string[] = $state([]);
	let selected_transport_technologies: string[] = $state([]);
	let selected_storage_technologies: string[] = $state([]);
	let selected_conversion_technologies: string[] = $state([]);
	let selected_aggregation: string = $state('Location');

	// let first_transport_technologies_update: boolean = $state(true);
	// let first_conversion_technologies_update: boolean = $state(true);
	// let first_storage_technologies_update: boolean = $state(true);
	// let first_cost_carriers_update: boolean = $state(true);
	// let first_demand_carriers_update: boolean = $state(true);
	let url_transport_technologies: number[] = $state([]);
	let url_conversion_technologies: number[] = $state([]);
	let url_storage_technologies: number[] = $state([]);
	let url_cost_carriers: number[] = $state([]);
	let url_demand_carriers: number[] = $state([]);

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
		if (!selected_solution) {
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
		},
		plugins: {
			tooltip: {
				callbacks: {
					label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
						`${item.dataset.label}: ${item.formattedValue} ${unit}`
				}
			}
		}
	});

	let labels: string[] = $derived.by(() => {
		return selected_years.map((year) => year.toString());
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
		if (!selected_solution || !fetched_capex || !fetched_opex) {
			return [];
		}
		return selected_solution.detail.system.set_transport_technologies.filter((t) =>
			capex_opex_technologies.has(t)
		);
	});
	let conversion_technologies: string[] = $derived.by(() => {
		if (!selected_solution || !fetched_capex || !fetched_opex) {
			return [];
		}
		return remove_duplicates(
			selected_solution.detail.system.set_conversion_technologies.filter((t) =>
				capex_opex_technologies.has(t)
			)
		);
	});
	let storage_technologies: string[] = $derived.by(() => {
		if (!selected_solution || !fetched_capex || !fetched_opex) {
			return [];
		}
		return remove_duplicates(
			selected_solution.detail.system.set_storage_technologies.filter((t) =>
				capex_opex_technologies.has(t)
			)
		);
	});

	let cost_carriers: string[] = $derived.by(() => {
		if (!selected_solution || !fetched_cost_carrier?.data) {
			return [];
		}
		return remove_duplicates(fetched_cost_carrier.data.map((row) => row[combined_name]));
	});

	let demand_carriers: string[] = $derived.by(() => {
		if (!selected_solution || !fetched_cost_shed_demand?.data) {
			return [];
		}
		return remove_duplicates(fetched_cost_shed_demand.data.map((row) => row[combined_name]));
	});

	let locations: string[] = $derived.by(() => {
		if (!selected_solution) {
			return [];
		}
		return Object.keys(selected_solution.detail.edges).concat(
			selected_solution.detail.system.set_nodes
		);
	});

	// Reset selected values when options change
	$effect(() => {
		transport_technologies;
		untrack(() => {
			if (url_transport_technologies.length && fetched_capex && fetched_opex) {
				if (transport_technologies.length > 0) {
					selected_transport_technologies = url_transport_technologies
						.map((i) => transport_technologies[i])
						.filter((t) => t !== undefined);
				}
				url_transport_technologies = [];
			} else if (transport_technologies.length > 0) {
				selected_transport_technologies = transport_technologies;
			}
		});
	});
	$effect(() => {
		conversion_technologies;
		untrack(() => {
			if (url_conversion_technologies.length && fetched_capex && fetched_opex) {
				if (conversion_technologies.length > 0) {
					selected_conversion_technologies = url_conversion_technologies
						.map((i) => conversion_technologies[i])
						.filter((t) => t !== undefined);
				}
				url_conversion_technologies = [];
			} else if (conversion_technologies.length > 0) {
				selected_conversion_technologies = conversion_technologies;
			}
		});
	});
	$effect(() => {
		storage_technologies;
		untrack(() => {
			if (url_storage_technologies.length && fetched_capex && fetched_opex) {
				if (storage_technologies.length > 0) {
					selected_storage_technologies = url_storage_technologies
						.map((i) => storage_technologies[i])
						.filter((t) => t !== undefined);
				}
				url_storage_technologies = [];
			} else if (storage_technologies.length > 0) {
				selected_storage_technologies = storage_technologies;
			}
		});
	});
	$effect(() => {
		cost_carriers;
		untrack(() => {
			if (url_cost_carriers.length && fetched_cost_carrier) {
				if (cost_carriers.length > 0) {
					selected_cost_carriers = url_cost_carriers
						.map((i) => cost_carriers[i])
						.filter((t) => t !== undefined);
				}
				url_cost_carriers = [];
			} else if (cost_carriers.length > 0) {
				selected_cost_carriers = cost_carriers;
			}
		});
	});
	$effect(() => {
		demand_carriers;
		untrack(() => {
			if (url_demand_carriers && fetched_cost_shed_demand) {
				if (demand_carriers.length > 0) {
					selected_demand_carriers = url_demand_carriers
						.map((i) => demand_carriers[i])
						.filter((t) => t !== undefined);
				}
				url_demand_carriers = [];
			} else if (demand_carriers.length > 0) {
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
			variable.show = getURLParamAsBoolean(key, variable.show);
			variable.subdivision = getURLParamAsBoolean(key + '_sub', variable.subdivision);
		});
		url_transport_technologies = getURLParamAsIntArray('tran');
		url_conversion_technologies = getURLParamAsIntArray('conv');
		url_storage_technologies = getURLParamAsIntArray('stor');
		url_cost_carriers = getURLParamAsIntArray('cost');
		url_demand_carriers = getURLParamAsIntArray('demand');
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
				tran: selected_transport_technologies
					.map((t) => transport_technologies.indexOf(t))
					.join('~'),
				conv: selected_conversion_technologies
					.map((t) => conversion_technologies.indexOf(t))
					.join('~'),
				stor: selected_storage_technologies.map((t) => storage_technologies.indexOf(t)).join('~'),
				cost: selected_cost_carriers.map((t) => cost_carriers.indexOf(t)).join('~'),
				demand: selected_demand_carriers.map((t) => demand_carriers.indexOf(t)).join('~')
			};
			Object.entries(variables).forEach(([key, variable]) => {
				params[key] = variable.show ? '1' : '0';
				params[key + '_sub'] = variable.subdivision ? '1' : '0';
			});
			updateURLParams(params);
		});
	});

	function solution_changed() {
		if (!selected_solution) {
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
		if (!selected_solution) {
			return;
		}
		fetching = true;

		let responses = await get_component_total(
			selected_solution.solution_name,
			[
				'cost_capex_yearly',
				'cost_opex_yearly',
				'cost_carbon_emissions_total',
				'cost_carrier',
				'cost_shed_demand'
			].map((variable) => {
				return get_variable_name(variable, selected_solution?.version);
			}),
			selected_solution.scenario_name
		);

		// "Standardize" all series names
		fetched_capex = rename_fields(responses.cost_capex_yearly || null, [
			['technology', combined_name]
		]);
		fetched_opex = rename_fields(responses.cost_opex_yearly || null, [
			['technology', combined_name]
		]);
		fetched_cost_carbon = responses.cost_carbon_emissions_total || null;
		fetched_cost_carrier = rename_fields(responses.cost_carrier || null, [
			['node', 'location'],
			['carrier', combined_name]
		]);
		fetched_cost_shed_demand = rename_fields(responses.cost_shed_demand || null, [
			['node', 'location'],
			['carrier', combined_name]
		]);

		if (responses.unit?.data) {
			units = Object.fromEntries(responses.unit.data.map((u) => [u.technology, u[0] || u.units]));
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
		let excluded_years = years.filter((year) => !selected_years.includes(year));

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
		let grouped_data: Record<string, any>[] = variableToDataMap.flatMap(({ key, data }) => {
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
				excluded_years,
				false
			).map((item: ChartDataset<'line' | 'bar'>) => {
				return {
					...item.data,
					location: item.label,
					[combined_name]: variables[key].label
				};
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

		// Get plot data, as a base we take the grouped data adapted to the cost selection.
		reset_color_state();
		let bar_data = filter_and_aggregate_data(
			grouped_data,
			dataset_selector,
			datasets_aggregates,
			[],
			false
		);

		// Get total carbon cost data
		let line_data: ChartDataset<'bar'>[] = [];
		if (
			fetched_cost_carbon?.data &&
			fetched_cost_carbon.data.length > 0 &&
			variables.carbon_emission.show
		) {
			const total_carbon_cost_data = Object.entries(fetched_cost_carbon.data[0])
				.filter(([key]) => !excluded_years.includes(Number(key)))
				.map(([_, value]) => value as number);
			line_data = [
				{
					data: total_carbon_cost_data,
					label: 'Total Carbon Costs',
					type: 'bar'
				}
			];
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
				<AllCheckbox label="Locations" bind:value={selected_locations} elements={locations}
				></AllCheckbox>
			{/if}
			{#if selected_years}
				<AllCheckbox label="Years" bind:value={selected_years} elements={years}></AllCheckbox>
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
			<BarPlot type="line" options={plot_options} {datasets} {labels} {plot_name}></BarPlot>
		{/if}
	{/if}
</div>
