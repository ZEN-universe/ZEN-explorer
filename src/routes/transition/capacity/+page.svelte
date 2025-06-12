<script lang="ts">
	import type { ChartOptions, ChartDataset } from 'chart.js';
	import type { ParseResult } from 'papaparse';
	import { onMount, tick, untrack } from 'svelte';

	import SolutionFilter from '$components/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';

	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data, remove_duplicates, to_options } from '$lib/utils';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	interface StringList {
		[key: string]: string[];
	}

	let data: ParseResult<Row> | null = $state(null);

	const variables: string[] = ['capacity', 'capacity_addition'];
	const technology_types: string[] = ['conversion', 'storage', 'transport'];
	const storage_type_options = ['energy', 'power'];
	const aggregation_options = [
		{ label: 'Node', value: 'node' },
		{ label: 'Technology', value: 'technology' }
	];
	let years: number[] = $state([]);

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_variable: string | null = $state('capacity');
	let selected_technology_type: string | null = $state('conversion');
	let selected_storage_type = $state('energy');
	let selected_carrier: string | null = $state(null);
	let selected_aggregation = $state('technology');
	let selected_normalization: boolean = $state(false);
	let selected_locations: string[] = $state([]);
	let selected_technologies: string[] = $state([]);
	let selected_years: number[] = $state([]);

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	// Units
	let units: { [carrier: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacity_type = selected_technology_type == 'storage' ? selected_storage_type : 'power';
		return units[technologies[0] + '_' + capacity_type] || '';
	});

	// Plot config
	let labels: string[] = $derived(selected_years.map((year) => year.toString()));
	let plot_options: ChartOptions<'bar'> = $derived({
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
					text: `${selected_variable} [${unit}]`
				}
			}
		},
		interaction: {
			intersect: false,
			mode: 'nearest',
			axis: 'x'
		}
	});
	let plot_name: string = $derived.by(() => {
		if (selected_solution == null) {
			return '';
		}
		return [
			selected_solution.solution_name.split('.').pop(),
			selected_solution.scenario_name,
			selected_variable,
			selected_technology_type,
			selected_carrier
		].join('_');
	});

	// Filter options
	let carriers: string[] = $derived.by(() => {
		if (data === null || selected_solution === null) {
			return [];
		}

		let carriers: string[] = [];
		data.data.forEach((element) => {
			let current_technology = element.technology;
			let current_carrier = selected_solution!.detail.reference_carrier[current_technology];

			if (!carriers.includes(current_carrier) && all_technologies.includes(element.technology)) {
				carriers.push(current_carrier);
			}
		});

		return carriers;
	});

	let all_technologies: string[] = $derived.by(() => {
		if (!selected_solution || !selected_technology_type) {
			return [];
		}

		const key = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selected_technology_type] as keyof typeof selected_solution.detail.system;
		return (selected_solution.detail.system[key] || []) as string[];
	});

	let technologies: string[] = $derived.by(() => {
		if (selected_solution === null || selected_technology_type === null) {
			return [];
		}

		return all_technologies.filter(
			(technology) => selected_solution?.detail.reference_carrier[technology] == selected_carrier
		);
	});

	let locations: string[] = $derived.by(() => {
		if (data === null) {
			return [];
		}

		return remove_duplicates(
			data.data
				.filter((element) => technologies.includes(element.technology))
				.map((element) => element.location)
		);
	});

	// Effects for filter options
	$effect(() => {
		carriers;

		untrack(() => {
			// Update the carriers whenever the carriers change
			if (selected_carrier == null || !carriers.includes(selected_carrier)) {
				selected_carrier = carriers.length > 0 ? carriers[0] : null;
			}
		});
	});

	$effect(() => {
		// Update the selected technologies whenever the technologies array changes
		selected_technologies = technologies;
	});

	$effect(() => {
		// Update the selected locations whenever the locations array changes
		selected_locations = locations;
	});

	// Store parts of the selected variables in the URL
	onMount(() => {
		selected_variable = get_url_param('variable') || selected_variable;
		selected_technology_type = get_url_param('technology_type') || selected_technology_type;
		selected_storage_type = get_url_param('storage_type') || selected_storage_type;
		selected_carrier = get_url_param('carrier') || selected_carrier;
	});

	$effect(() => {
		// Triggers
		selected_variable;
		selected_technology_type;
		selected_storage_type;
		selected_carrier;

		// Wait for router to be initialized
		tick().then(() => {
			update_url_params({
				variable: selected_variable,
				technology_type: selected_technology_type,
				storage_type: selected_storage_type,
				carrier: selected_carrier
			});
		});
	});

	/**
	 * Reset all selected variables to their defaults
	 */
	function reset_data_selection() {
		selected_aggregation = 'node';
		selected_normalization = false;
		selected_locations = locations;
		selected_technologies = technologies;
		selected_years = years;
	}

	/**
	 * This function is called is called whenever the solution filter sends a change event.
	 * It resets all the selected values of the form.
	 */
	async function on_solution_changed() {
		reset_data_selection();
		await fetch_data();
	}

	/**
	 * This function is called, whenever the variable in the form is changed.
	 * It will fetch the necessary data from the API.
	 */
	async function on_variable_changed() {
		reset_data_selection();
		await fetch_data();
	}

	/**
	 * This function is called, when the technology type is changed. It updates all the necessary values for further selection in the form.
	 */
	function on_technology_type_changed() {
		reset_data_selection();
	}

	/**
	 * This function is called, when the carrier is changed. It updates all the necessary values for further selection in the form.
	 */
	function on_carrier_changed() {
		reset_data_selection();
	}

	/**
	 * Fetch data from the API of the selected values in the form
	 */
	async function fetch_data() {
		if (selected_variable === null || selected_solution === null) {
			data = null;
			return;
		}

		fetching = true;
		data = null;

		const fetched = await get_component_total(
			selected_solution.solution_name,
			selected_variable,
			selected_solution.scenario_name,
			selected_solution.detail.system.reference_year,
			selected_solution.detail.system.interval_between_years
		);

		data = fetched.data;

		if (fetched.unit?.data) {
			units = Object.fromEntries(
				fetched.unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
		}

		fetching = false;
	}

	let datasets: ChartDataset<'bar'>[] = $derived.by(() => {
		if (
			selected_variable == null ||
			selected_locations.length == 0 ||
			selected_years.length == 0 ||
			selected_technologies.length == 0 ||
			data === null
		) {
			return [];
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (selected_aggregation == 'technology') {
			dataset_selector['location'] = selected_locations;
			datasets_aggregates['technology'] = selected_technologies;
		} else {
			// Case: selected_aggregation == 'node'
			dataset_selector['technology'] = selected_technologies;
			datasets_aggregates['location'] = selected_locations;
		}

		if (selected_technology_type == 'storage') {
			datasets_aggregates['capacity_type'] = [selected_storage_type];
		} else {
			datasets_aggregates['capacity_type'] = storage_type_options;
		}

		let excluded_years = years.filter((year) => !selected_years.includes(year));

		return filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalization
		) as unknown as ChartDataset<'bar'>[];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Capacity</h1>
<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:selected_solution
			bind:loading={solution_loading}
			bind:years
			solution_selected={on_solution_changed}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Variable Selection">
			<FilterRow label="Variable">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(variables)}
						bind:value={selected_variable}
						disabled={fetching || solution_loading}
						onUpdate={on_variable_changed}
					></Dropdown>
				{/snippet}
			</FilterRow>
			{#if selected_variable != null}
				<FilterRow label="Technology Type">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							options={to_options(technology_types)}
							bind:value={selected_technology_type}
							disabled={fetching || solution_loading}
							onUpdate={on_technology_type_changed}
						></Dropdown>
					{/snippet}
				</FilterRow>
				{#if selected_technology_type == 'storage'}
					<FilterRow label="">
						{#snippet content(formId)}
							<Radio
								{formId}
								options={to_options(storage_type_options)}
								bind:value={selected_storage_type}
								onUpdate={on_technology_type_changed}
								disabled={fetching || solution_loading}
							></Radio>
						{/snippet}
					</FilterRow>
				{/if}
			{/if}
			{#if selected_technology_type != null && carriers.length > 0}
				<FilterRow label="Carrier">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							options={to_options(carriers)}
							bind:value={selected_carrier}
							disabled={fetching || solution_loading}
							onUpdate={on_carrier_changed}
						></Dropdown>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
		{#if data && selected_technology_type && selected_carrier && technologies.length > 0 && locations.length > 0}
			<FilterSection title="Data Selection">
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
				{#if selected_aggregation == 'technology'}
					<AllCheckbox label="Technology" bind:value={selected_technologies} elements={technologies}
					></AllCheckbox>
				{:else}
					<AllCheckbox label="Node" bind:value={selected_locations} elements={locations}
					></AllCheckbox>
				{/if}
				<AllCheckbox label="Year" bind:value={selected_years} elements={years}></AllCheckbox>
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
		<BarPlot type="bar" {datasets} {labels} options={plot_options} {plot_name}></BarPlot>
	{/if}
</div>
