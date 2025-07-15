<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions } from 'chart.js';
	import type { ParseResult } from 'papaparse';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';

	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import type { ActivatedSolution, ComponentTotal } from '$lib/types';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';
	import { reset_color_state } from '$lib/colors';

	let technology_data: ComponentTotal | null = $state(null);
	let carrier_data: ComponentTotal | null = $state(null);
	let annual_data: ComponentTotal | null = $state(null);
	let cumulative_data: ComponentTotal | null = $state(null);
	let annual_limit_data: ComponentTotal | null = $state(null);
	let cumulative_limit_data: ComponentTotal | null = $state(null);
	let subdivision_units: { [carrier: string]: string } = $state({});
	let cumulation_units: { [carrier: string]: string } = $state({});

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let nodes: string[] = $state([]);
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
					text: `Emissions [${unit}]`
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
		return remove_duplicates(technology_data.data.data.map((d) => d.technology));
	});

	let carriers: string[] = $derived.by(() => {
		if (!carrier_data?.data) {
			return [];
		}
		return remove_duplicates(carrier_data.data.data.map((d) => d.carrier));
	});

	let locations: string[] = $derived.by(() => {
		if (!technology_data?.data && !carrier_data?.data) {
			return [];
		}
		return remove_duplicates(
			[...(technology_data?.data?.data || []), ...(carrier_data?.data?.data || [])].map(
				(d) => d.location
			)
		);
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
		let subdivision_param = get_url_param('subdivision');
		selected_subdivision =
			subdivision_param !== null ? subdivision_param === 'true' : selected_subdivision;
		selected_cumulation = get_url_param('cumulation') || selected_cumulation;
	});

	$effect(() => {
		// Triggers
		selected_subdivision;
		selected_cumulation;

		// Wait for router to be initialized
		tick().then(() => {
			update_url_params({
				subdivision: selected_subdivision ? 'true' : 'false',
				cumulation: selected_cumulation
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

		[
			technology_data,
			carrier_data,
			annual_limit_data,
			cumulative_limit_data,
			annual_data,
			cumulative_data
		] = await Promise.all(
			[
				'carbon_emissions_technology',
				'carbon_emissions_carrier',
				'carbon_emissions_annual_limit',
				'carbon_emissions_budget',
				'carbon_emissions_annual',
				'carbon_emissions_cumulative'
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

		// Rename "node" to "location" so both technology and carrier data have the same key names
		if (carrier_data.data?.data) {
			carrier_data.data.data = carrier_data.data.data.map((d) => {
				return {
					...d,
					location: d.location || d.node // Fallback to node if location is not present
				};
			});
		}

		if (carrier_data.unit?.data) {
			subdivision_units = Object.fromEntries(
				carrier_data.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		if (annual_data.unit?.data) {
			cumulation_units = Object.fromEntries(
				annual_data.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		if (cumulative_limit_data.data && cumulative_limit_data.data.data.length > 0) {
			// Copy the value of the first year to all years in the cumulative data
			cumulative_limit_data.data.data[0] = Object.fromEntries(
				years.map((year) => [year, cumulative_limit_data!.data!.data[0][years[0]]])
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

		let data: ParseResult<any>;
		if (selected_subdivision) {
			data = {
				data: carrier_data.data.data
					.map((d) => {
						return {
							...d,
							technology_carrier: d.carrier
						};
					})
					.concat(
						technology_data.data.data.map((d) => {
							return {
								...d,
								technology_carrier: d.technology
							};
						})
					),
				meta: carrier_data.data.meta,
				errors: []
			};
		} else if (selected_cumulation == 'Annual') {
			data = annual_data.data;
		} else {
			data = cumulative_data.data;
		}

		reset_color_state();
		const filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		);

		if (filtered_data.length == 1) {
			filtered_data[0].label = division_variable;
		}

		return filtered_data as ChartDataset<'bar'>[];
	});

	let line_datasets: ChartDataset<'line'>[] = $derived.by(() => {
		if (
			selected_solution === null ||
			annual_limit_data === null ||
			cumulative_limit_data === null
		) {
			return [];
		}

		let limit_data: ParseResult<any> | null = null;
		if (
			division_variable == get_variable_name('carbon_emissions_annual', selected_solution?.version)
		) {
			limit_data = annual_limit_data.data;
		} else {
			limit_data = cumulative_limit_data.data;
		}

		if (limit_data?.data == null || limit_data.data.length == 0) {
			return [];
		}

		let filtered_limit_data = filter_and_aggregate_data(
			limit_data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		);

		if (filtered_limit_data.length == 0) {
			return [];
		}

		filtered_limit_data[0].label =
			selected_cumulation == 'Annual' ? 'Annual Emissions Limit' : 'Carbon Emissions Budget';
		filtered_limit_data[0].type = 'line';

		return filtered_limit_data as unknown as ChartDataset<'line'>[];
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
			bind:nodes
			bind:years
			bind:loading={solution_loading}
			disabled={fetching || solution_loading}
			solution_selected={on_solution_selected}
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
