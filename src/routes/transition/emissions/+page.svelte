<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
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

	let data: ParseResult<any> | null = $state(null);
	let limit_data: ParseResult<any> | null = $state(null);
	let units: { [carrier: string]: string } = $state({});
	let filtered_data: any[] = $state([]);
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
		if (selected_carriers.length == 0) {
			return '';
		}
		if (!selected_subdivision) {
			return Object.values(units)[0] || '';
		}
		return units[selected_carriers[0]] || '';
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

	let carbon_emissions_technology: ComponentTotal | null = $state(null);
	let carbon_emissions_carrier: ComponentTotal | null = $state(null);

	let technologies: string[] = $derived.by(() => {
		if (!carbon_emissions_technology?.data) {
			return [];
		}
		return remove_duplicates(carbon_emissions_technology.data.data.map((d) => d.technology));
	});

	let carriers: string[] = $derived.by(() => {
		if (!carbon_emissions_carrier?.data) {
			return [];
		}
		return remove_duplicates(carbon_emissions_carrier.data.data.map((d) => d.carrier));
	});

	let locations: string[] = $derived.by(() => {
		if (!carbon_emissions_technology?.data && !carbon_emissions_carrier?.data) {
			return [];
		}
		return remove_duplicates(
			[
				...(carbon_emissions_technology?.data?.data || []),
				...(carbon_emissions_carrier?.data?.data || [])
			].map((d) => d.location)
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
		selected_subdivision = get_url_param('subdivision') === 'true' || selected_subdivision;
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

	$effect(() => {
		if (selected_solution === null) {
			data = null;
			limit_data = null;
			units = {};
			return;
		}

		selected_cumulation;

		if (selected_subdivision) {
			untrack(fetch_subdivision_data);
		} else {
			untrack(fetch_cumulation_data);
		}
	});

	/**
	 * Fetches the relevant data for when subdivision is active.
	 * In that case, we need the data series carbon_emissions_technology and carbon_emissions_carrier.
	 * We then combine the data series by renaming the "technology" column and the "carrier" column in the two respective data sets into "technology_carrier".
	 */
	async function fetch_subdivision_data() {
		if (selected_solution === null || !selected_subdivision) {
			return;
		}
		fetching = true;

		// Fetch carbon_emissions_technology and carbon_emissions_carrier
		[carbon_emissions_technology, carbon_emissions_carrier] = await Promise.all([
			get_component_total(
				selected_solution!.solution_name,
				get_variable_name('carbon_emissions_technology', selected_solution?.version),
				selected_solution!.scenario_name,
				selected_solution!.detail.system.reference_year,
				selected_solution!.detail.system.interval_between_years
			),
			get_component_total(
				selected_solution!.solution_name,
				get_variable_name('carbon_emissions_carrier', selected_solution?.version),
				selected_solution!.scenario_name,
				selected_solution!.detail.system.reference_year,
				selected_solution!.detail.system.interval_between_years
			)
		]);

		if (!carbon_emissions_technology.data || !carbon_emissions_carrier.data) {
			fetching = false;
			return;
		}

		// Rename "node" to "location" so both data series have the same location-name
		for (let i of carbon_emissions_carrier.data.data) {
			if ('node' in i) {
				i.location = i.node;
				delete i.node;
			}
		}

		// Rename "carrier" and "technology" columns into technology_carrier and group all datasets into one list.
		data = {
			data: carbon_emissions_carrier.data.data
				.map((d) => {
					return {
						...d,
						technology_carrier: d.carrier
					};
				})
				.concat(
					carbon_emissions_technology.data.data.map((d) => {
						return {
							...d,
							technology_carrier: d.technology
						};
					})
				),
			meta: carbon_emissions_carrier.data.meta,
			errors: []
		};

		if (carbon_emissions_carrier.unit?.data) {
			units = Object.fromEntries(
				carbon_emissions_carrier.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	/**
	 * Fetch the relevant data if subdivision is not activated.
	 */
	async function fetch_cumulation_data() {
		if (division_variable === null || selected_solution === null || selected_subdivision) {
			return;
		}

		fetching = true;

		// Fetch the limit data
		if (
			division_variable == get_variable_name('carbon_emissions_annual', selected_solution?.version)
		) {
			let res = await get_component_total(
				selected_solution.solution_name,
				get_variable_name('carbon_emissions_annual_limit', selected_solution?.version),
				selected_solution.scenario_name,
				selected_solution.detail.system.reference_year,
				selected_solution.detail.system.interval_between_years
			);
			limit_data = res.data;
		} else {
			let res = await get_component_total(
				selected_solution.solution_name,
				get_variable_name('carbon_emissions_budget', selected_solution?.version),
				selected_solution.scenario_name,
				selected_solution.detail.system.reference_year,
				selected_solution.detail.system.interval_between_years
			);
			console.log('Limit data:', res.data);

			if (res.data && res.data.data.length > 0) {
				// Copy the value of the first year to all years in the limit data
				res.data.data[0] = Object.fromEntries(
					years.map((year) => [year, res.data!.data[0][years[0]]])
				);
			}
			limit_data = res.data;
		}

		// Get variable values
		const fetched = await get_component_total(
			selected_solution.solution_name,
			division_variable,
			selected_solution.scenario_name,
			selected_solution.detail.system.reference_year,
			selected_solution.detail.system.interval_between_years
		);

		data = fetched.data;

		if (fetched.unit?.data) {
			units = Object.fromEntries(
				fetched.unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		if (selected_solution === null || data === null) {
			return [];
		}

		let dataset_selector: { [key: string]: string[] } = {};
		let datasets_aggregates: { [key: string]: string[] } = {};
		if (selected_subdivision) {
			if (selected_aggregation == 'location') {
				dataset_selector = { ['technology_carrier']: technologies.concat(carriers) };
				datasets_aggregates = { ['location']: selected_locations };
			} else {
				dataset_selector = { ['location']: locations };
				datasets_aggregates = {
					['technology_carrier']: selected_technologies.concat(selected_carriers)
				};
			}
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		const filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		);

		if (filtered_data.length == 0) {
			return [];
		}

		if (selected_subdivision || limit_data === null) {
			return filtered_data as unknown as ChartDataset<'bar'>[];
		}

		if (filtered_data.length == 1) {
			filtered_data[0].label = division_variable;
		}

		let filtered_limit_data = filter_and_aggregate_data(
			limit_data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		);

		if (filtered_limit_data.length == 0) {
			return filtered_data as unknown as ChartDataset<'bar'>[];
		}

		filtered_limit_data[0].label =
			selected_cumulation == 'Annual' ? 'Annual Emissions Limit' : 'Carbon Emissions Budget';
		filtered_limit_data[0].type = 'line';
		return filtered_data.concat(filtered_limit_data) as unknown as ChartDataset<'bar' | 'line'>[];
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
					<AllCheckbox label="Location" bind:value={selected_locations} elements={locations}
					></AllCheckbox>
				{:else}
					{#if technologies.length > 0}
						<AllCheckbox
							label="Technology"
							bind:value={selected_technologies}
							elements={technologies}
						></AllCheckbox>
					{/if}
					{#if carriers.length > 0}
						<AllCheckbox label="Carrier" bind:value={selected_carriers} elements={carriers}
						></AllCheckbox>
					{/if}
				{/if}
			{/if}
			<AllCheckbox label="Year" bind:value={selected_years} elements={years}></AllCheckbox>
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
	{:else if filtered_data != null && selected_solution != null}
		{#if datasets.length == 0 || selected_years.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<BarPlot type="bar" options={plot_options} {datasets} {plot_name}></BarPlot>
		{/if}
	{/if}
</div>
