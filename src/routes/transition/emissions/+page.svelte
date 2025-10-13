<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';

	import { get_component_total, get_unit } from '$lib/temple';
	import {
		filter_and_aggregate_data,
		normalize_dataset,
		remove_duplicates,
		to_options
	} from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { getURLParam, getURLParamAsBoolean, updateURLParams } from '$lib/queryParams.svelte';
	import { resetColorState } from '$lib/colors';

	let technology_data: ParseResult<Row> | null = $state(null);
	let carrier_data: ParseResult<Row> | null = $state(null);
	let annual_data: ParseResult<Row> | null = $state(null);
	let cumulative_data: ParseResult<Row> | null = $state(null);
	let annual_limit_data: ParseResult<Row> | null = $state(null);
	let cumulative_limit_data: ParseResult<Row> | null = $state(null);
	let subdivision_units: { [carrier: string]: string } = $state({});
	let cumulation_units: { [carrier: string]: string } = $state({});

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let years: number[] = $state([]);
	const aggregation_options: { label: string; value: string }[] = [
		{ label: 'Location', value: 'location' },
		{ label: 'Technology & Carrier', value: 'technology_carrier' }
	];
	const cumulation_options: string[] = ['Annual', 'Cumulative'];

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_subdivision: boolean = $state(true);
	let selected_cumulation: string = $state('Annual');
	let selected_carriers: string[] = $state([]);
	let selected_technologies: string[] = $state([]);
	let selected_aggregation: string = $state('location');
	let selected_normalization: boolean = $state(false);
	let selected_locations: string[] = $state([]);
	let selected_years: number[] = $state([]);

	let plot_name = $derived.by(() => {
		if (!selected_solution?.solution_name) {
			return '';
		}
		let solution_names = selected_solution.solution_name.split('.');
		return [
			solution_names[solution_names.length - 1],
			selected_solution.scenario_name,
			division_variable
		].join('_');
	});
	let unit: string = $derived.by(() => {
		if (selected_subdivision) {
			return Object.values(subdivision_units)[0] || '';
		} else {
			return Object.values(cumulation_units)[0] || '';
		}
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
					text: `Emissions` + (selected_normalization ? '' : ` [${unit}]`)
				},
				max: selected_normalization ? 1 : undefined,
				suggestedMin: selected_normalization ? -1 : undefined
			}
		},
		plugins: {
			tooltip: {
				callbacks: {
					label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
						`${item.dataset.label}: ${item.formattedValue}` +
						(selected_normalization ? '' : ` ${unit}`)
				}
			}
		},
		interaction: {
			intersect: false,
			mode: 'nearest',
			axis: 'x'
		}
	});

	let division_variable = $derived.by(() => {
		if (selected_subdivision) {
			return get_variable_name('carbon_emissions_carrier', selected_solution?.version);
		} else if (selected_cumulation == 'Annual') {
			return get_variable_name('carbon_emissions_annual', selected_solution?.version);
		} else {
			return get_variable_name('carbon_emissions_cumulative', selected_solution?.version);
		}
	});

	let technologies: string[] = $derived.by(() => {
		if (!technology_data?.data) {
			return [];
		}
		return remove_duplicates(technology_data.data.map((d) => d.technology));
	});

	let carriers: string[] = $derived.by(() => {
		if (!carrier_data?.data) {
			return [];
		}
		return remove_duplicates(carrier_data.data.map((d) => d.carrier));
	});

	let locations: string[] = $derived.by(() => {
		if (!technology_data?.data && !carrier_data?.data) {
			return [];
		}
		return remove_duplicates(
			[...(technology_data?.data || []), ...(carrier_data?.data || [])].map((d) => d.location)
		).sort();
	});

	$effect(() => {
		selected_technologies = technologies;
	});
	$effect(() => {
		selected_carriers = carriers;
	});
	$effect(() => {
		selected_locations = locations;
	});
	$effect(() => {
		selected_years = years;
	});

	// Store parts of the selected variables in the URL
	onMount(() => {
		selected_subdivision = getURLParamAsBoolean('subdiv', selected_subdivision);
		selected_cumulation = getURLParam('cumul') || selected_cumulation;
	});

	$effect(() => {
		// Triggers
		selected_subdivision;
		selected_cumulation;

		// Wait for router to be initialized
		tick().then(() => {
			updateURLParams({
				subdiv: selected_subdivision ? '1' : '0',
				cumul: selected_cumulation
			});
		});
	});

	function on_solution_selected() {
		fetch_data();
	}

	async function fetch_data() {
		if (selected_solution === null) {
			return;
		}

		fetching = true;

		const components = {
			technology: get_variable_name('carbon_emissions_technology', selected_solution.version),
			carrier: get_variable_name('carbon_emissions_carrier', selected_solution.version),
			annual_limit: get_variable_name('carbon_emissions_annual_limit', selected_solution.version),
			budget: get_variable_name('carbon_emissions_budget', selected_solution.version),
			annual: get_variable_name('carbon_emissions_annual', selected_solution.version),
			cumulative: get_variable_name('carbon_emissions_cumulative', selected_solution.version)
		};
		let [responses, annual_unit_data] = await Promise.all([
			get_component_total(
				selected_solution.solution_name,
				Object.values(components),
				selected_solution.scenario_name,
				components.carrier
			),
			get_unit(selected_solution.solution_name, components.annual, selected_solution.scenario_name)
		]);

		technology_data = responses[components.technology];
		carrier_data = responses[components.carrier];
		annual_limit_data = responses[components.annual_limit];
		cumulative_limit_data = responses[components.budget];
		annual_data = responses[components.annual];
		cumulative_data = responses[components.cumulative];

		// Rename "node" to "location" so both technology and carrier data have the same key names
		if (carrier_data?.data) {
			carrier_data.data = carrier_data.data.map((d) => {
				return {
					...d,
					location: d.location || d.node // Fallback to node if location is not present
				};
			});
		}

		if (cumulative_limit_data && cumulative_limit_data.data.length > 0) {
			// Copy the value of the first year to all years in the cumulative data
			const cumulative_limit_value = Number(Object.values(cumulative_limit_data.data[0])[0]);
			cumulative_limit_data.data[0] = Object.fromEntries(
				years.map((year) => [year, cumulative_limit_value])
			);
		}

		if (responses.unit?.data) {
			subdivision_units = Object.fromEntries(
				responses.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		if (annual_unit_data.data) {
			cumulation_units = Object.fromEntries(
				annual_unit_data.data.map((unit: any) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	let dataset_selector: { [key: string]: string[] } = $derived.by(() => {
		if (!selected_subdivision) {
			return {} as { [key: string]: string[] };
		} else if (selected_aggregation == 'location') {
			return { ['technology_carrier']: technologies.concat(carriers) };
		} else {
			return { ['location']: locations };
		}
	});
	let datasets_aggregates: { [key: string]: string[] } = $derived.by(() => {
		if (!selected_subdivision) {
			return {} as { [key: string]: string[] };
		} else if (selected_aggregation == 'location') {
			return { ['location']: selected_locations };
		} else {
			return {
				['technology_carrier']: selected_technologies.concat(selected_carriers)
			};
		}
	});
	let excluded_years = $derived(years.filter((year) => !selected_years.includes(year)));

	let bar_datasets: ChartDataset<'bar'>[] = $derived.by(() => {
		if (
			selected_solution === null ||
			!annual_data?.data ||
			!cumulative_data?.data ||
			!carrier_data?.data ||
			!technology_data?.data
		) {
			return [];
		}

		let data: Row[];
		if (selected_subdivision) {
			data = carrier_data.data
				.map((d) => {
					return {
						...d,
						technology_carrier: d.carrier
					};
				})
				.concat(
					technology_data.data.map((d) => {
						return {
							...d,
							technology_carrier: d.technology
						};
					})
				);
		} else if (selected_cumulation == 'Annual') {
			data = annual_data.data;
		} else {
			data = cumulative_data.data;
		}

		resetColorState();
		const filtered_data = filter_and_aggregate_data(
			data,
			dataset_selector,
			datasets_aggregates,
			excluded_years
		) as ChartDataset<'bar'>[];

		if (filtered_data.length == 1) {
			filtered_data[0].label = division_variable;
		}

		if (selected_normalization) {
			return normalize_dataset(filtered_data);
		}
		return filtered_data;
	});

	let line_datasets: ChartDataset<'line' | 'bar'>[] = $derived.by(() => {
		if (
			selected_solution === null ||
			annual_limit_data === null ||
			cumulative_limit_data === null
		) {
			return [];
		}

		let limit_data: Row[] | null = null;
		if (
			division_variable == get_variable_name('carbon_emissions_annual', selected_solution?.version)
		) {
			limit_data = annual_limit_data.data;
		} else {
			limit_data = cumulative_limit_data.data;
		}

		if (limit_data == null || limit_data?.length == 0) {
			return [];
		}

		let filtered_limit_data = filter_and_aggregate_data(
			limit_data,
			dataset_selector,
			datasets_aggregates,
			excluded_years
		);

		if (filtered_limit_data.length == 0) {
			return [];
		}

		filtered_limit_data[0].label =
			selected_cumulation == 'Annual' ? 'Annual Emissions Limit' : 'Carbon Emissions Budget';
		filtered_limit_data[0].type = 'line';

		return filtered_limit_data as unknown as ChartDataset<'line' | 'bar'>[];
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		return (bar_datasets as ChartDataset<'bar' | 'line'>[]).concat(line_datasets);
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Emissions</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:years
			bind:loading={solution_loading}
			disabled={fetching || solution_loading}
			solutionSelected={on_solution_selected}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Variable Selection">
			<FilterRow label="Subdivision">
				{#snippet content(formId)}
					<ToggleButton {formId} bind:value={selected_subdivision}></ToggleButton>
				{/snippet}
			</FilterRow>
			{#if !selected_subdivision}
				<FilterRow label="Cumulation">
					{#snippet content(formId)}
						<Radio
							{formId}
							options={to_options(cumulation_options)}
							bind:value={selected_cumulation}
							disabled={fetching || solution_loading}
						></Radio>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
	{/if}
	{#if !solution_loading && selected_solution && !fetching}
		<FilterSection title="Data Selection">
			{#if selected_subdivision}
				<FilterRow label="Aggregation">
					{#snippet content(formId)}
						<Radio {formId} options={aggregation_options} bind:value={selected_aggregation}></Radio>
					{/snippet}
				</FilterRow>
				<FilterRow label="Normalization">
					{#snippet content(formId)}
						<ToggleButton {formId} bind:value={selected_normalization}></ToggleButton>
					{/snippet}
				</FilterRow>
				{#if selected_aggregation == 'location'}
					<AllCheckbox label="Locations" bind:value={selected_locations} elements={locations}
					></AllCheckbox>
				{:else}
					{#if technologies.length > 0}
						<AllCheckbox
							label="Technologies"
							bind:value={selected_technologies}
							elements={technologies}
						></AllCheckbox>
					{/if}
					{#if carriers.length > 0}
						<AllCheckbox label="Carriers" bind:value={selected_carriers} elements={carriers}
						></AllCheckbox>
					{/if}
				{/if}
			{/if}
			<AllCheckbox label="Years" bind:value={selected_years} elements={years}></AllCheckbox>
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
	{:else if selected_solution == null}
		<div class="text-center">No solution selected</div>
	{:else if datasets.length == 0 || selected_years.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot
			type="bar"
			options={plot_options}
			labels={selected_years.map((year) => year.toString())}
			{datasets}
			{plot_name}
		></BarPlot>
	{/if}
</div>
