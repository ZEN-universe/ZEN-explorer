<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { filter_and_aggregate_data, stringify } from '$lib/utils';
	import BarPlot from '../../../components/BarPlot.svelte';

	import Radio from '../../../components/Radio.svelte';
	import { get_component_total } from '$lib/temple';
	import Papa from 'papaparse';
	import { get_variable_name } from '$lib/variables';
	import type { ChartConfiguration } from 'chart.js';
	import Filters from '../../../components/Filters.svelte';
	import FilterSection from '../../../components/FilterSection.svelte';
	import Dropdown from '../../../components/Dropdown.svelte';
	import ToggleButton from '../../../components/ToggleButton.svelte';

	// Data
	let data: Papa.ParseResult<any> | null = $state(null);
	let filtered_data: any[] = $state([]);
	let units: { [carrier: string]: string } = $state({});

	// Filter options
	// let variables: { [key: string]: string[] } = $state({
	// 	conversion: ['input', 'output'],
	// 	storage: ['charge', 'discharge'],
	// 	transport: [],
	// 	import_export: ['import', 'export']
	// });
	let carriers: string[] = $state([]);
	let technologies: string[] = $state([]);
	const aggregation_options = ['technology', 'node'];
	const normalisation_options = ['not_normalized', 'normalized'];
	let nodes: string[] = $state([]);
	let edges: string[] = $state([]);
	let locations: string[] = $state([]);
	let years: number[] = $state([]);

	// Variables
	let variables: { [key: string]: { title: string; show: boolean; subdivision: boolean } } = $state(
		{
			conversion: { title: 'Conversion', show: true, subdivision: true },
			storage: { title: 'Storage', show: true, subdivision: true },
			transport: { title: 'Transport', show: true, subdivision: false },
			import_export: { title: 'Import/Export', show: true, subdivision: false }
		}
	);

	// Selected values
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_variable: string | null = $state('conversion');
	let selected_subvariable: string | null = $state('input');
	let selected_carrier: string | null = $state(null);
	let selected_technologies: string[] = $state([]);
	let selected_locations: string[] = $state([]);
	let selected_years: number[] = $state([]);
	let selected_aggregation = $state('node');
	let selected_normalisation: string = $state('not_normalized');

	// States
	let solution_loading: boolean = $state(false);
	let fetching = $state(false);
	let plot_name = $state('plot');

	// Plot config
	let labels: string[] = $state([]);
	let plot_config: ChartConfiguration = $derived({
		type: 'bar',
		data: { datasets: filtered_data, labels: labels },
		options: {
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
						text: `${selected_variable} [${selected_carrier ? units[selected_carrier] : ''}]`
					}
				}
			}
		}
	});

	// Data types
	interface StringList {
		[key: string]: string[];
	}

	/**
	 * This function refetches the data from the API and then updates the carriers, technologies, locations and the plot.
	 */
	async function refetch() {
		await fetch_data();

		update_carriers();
		update_technologies();
		update_locations();
		update_data();
	}

	/**
	 * This function resets the selections of the form.
	 */
	function reset_data_selection() {
		selected_years = years;
		selected_locations = locations;
		selected_technologies = technologies;
	}

	/**
	 * This function returns the variable name depending on the variable selection
	 */
	function get_local_variable() {
		switch (selected_variable) {
			case 'conversion':
				return 'flow_conversion_' + selected_subvariable;
			case 'storage':
				return 'flow_storage_' + selected_subvariable;
			case 'transport':
				return 'flow_transport';
			case 'import_export':
				return 'flow_' + selected_subvariable;
			default:
				return null;
		}
	}

	/**
	 * This function fetches the relevant data from the API server given the current selection
	 */
	async function fetch_data() {
		fetching = true;
		data = null;
		let variable_name = get_local_variable();
		if (variable_name === null || selected_solution === null) {
			fetching = false;
			return;
		}

		// Get the versioned name of the variable
		variable_name = get_variable_name(variable_name, selected_solution?.version);

		// Fetch the data
		let fetched = await get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years
		);

		if (fetched.data === null) {
			return;
		}
		data = fetched.data;

		if (fetched.unit?.data) {
			units = Object.fromEntries(fetched.unit.data.map((u) => [u.carrier, u[0] || u.units]));
		}

		fetching = false;
	}

	/**
	 * This function updates the available carriers depending on the current selection and resets the data selection.
	 */
	function update_carriers() {
		if (data == null || selected_solution == null) {
			carriers = [];
			return;
		}

		filtered_data = [];

		switch (selected_variable) {
			case get_variable_name('import_export', selected_solution?.version):
				if (selected_subvariable == 'import') {
					carriers = selected_solution!.detail.carriers_import;
				} else {
					carriers = selected_solution!.detail.carriers_export;
				}
				break;
			case get_variable_name('conversion', selected_solution?.version):
				let relevant_carriers;
				if (selected_subvariable == 'input') {
					relevant_carriers = selected_solution!.detail.carriers_input;
				} else {
					relevant_carriers = selected_solution!.detail.carriers_output;
				}

				carriers = Array.from(new Set(Object.values(relevant_carriers).flat()));
				break;
			default:
				carriers = selected_solution!.detail.system.set_carriers;
		}

		let possible_carriers = null;
		if (selected_variable == 'import_export') {
			possible_carriers = Array.from(new Set(data.data.map((d) => d.carrier)));
		} else if (selected_variable != get_variable_name('conversion', selected_solution?.version)) {
			possible_carriers = Array.from(
				new Set(data.data.map((d) => selected_solution?.detail.reference_carrier[d.technology]))
			);
		}

		if (possible_carriers != null) {
			carriers = carriers.filter((d) => possible_carriers.includes(d));
		}

		if ((carriers.length >= 1 && !selected_carrier) || !carriers.includes(selected_carrier!)) {
			selected_carrier = carriers[0];
		}

		reset_data_selection();
	}

	/**
	 * This function updates the available technologies given the currently selected solution and variable.
	 */
	function update_technologies() {
		filtered_data = [];

		if (selected_variable == null) {
			return;
		}
		if (selected_carrier == null) {
			return;
		}

		technologies = selected_solution?.detail.system.set_technologies.slice() ?? [];

		switch (selected_variable) {
			case 'conversion':
				technologies = [];
				let relevant_carriers = selected_solution!.detail.carriers_input;
				if (selected_subvariable == 'output') {
					relevant_carriers = selected_solution!.detail.carriers_output;
				}
				for (const technology in relevant_carriers) {
					if (relevant_carriers[technology].includes(selected_carrier)) {
						technologies.push(technology);
					}
				}
				break;
			case 'storage':
				technologies =
					selected_solution?.detail.system.set_storage_technologies.filter(
						(technology) =>
							selected_solution?.detail.reference_carrier[technology] == selected_carrier
					) ?? [];

				break;
			case 'transport':
				technologies =
					selected_solution?.detail.system.set_transport_technologies.filter(
						(technology) =>
							selected_solution?.detail.reference_carrier[technology] == selected_carrier
					) ?? [];
				break;
			case 'import_export':
				technologies = [];
				break;
		}

		if (technologies.length == 1) {
			selected_technologies = [technologies[0]];
		}

		reset_data_selection();
	}

	/**
	 * This function updates the available locations to select.
	 */
	function update_locations() {
		if (selected_variable == 'transport') {
			locations = edges;
		} else {
			locations = nodes;
		}
		selected_locations = locations;

		reset_data_selection();
	}

	// /**
	//  * This function is being called whenever the selected variable is changed.
	//  * It resets the form according to the selected variable.
	//  */
	// function updated_variable() {
	// 	filtered_data = [];

	// 	if (selected_variable == null) {
	// 		return;
	// 	}

	// 	if (variables[selected_variable] != null) {
	// 		selected_subvariable = variables[selected_variable]![0];
	// 	}

	// 	if (selected_variable == 'import_export') {
	// 		selected_aggregation = 'technology';
	// 	}
	// }

	/**
	 * This function updates the plot data according to the current form selection.
	 */
	function update_data() {
		if (selected_variable == 'import_export') {
			selected_aggregation = 'node';
		}

		// If the selected aggregation is technology, include all available nodes and vice versa
		if (selected_aggregation == 'technology') {
			selected_locations = locations;
		} else {
			selected_technologies = technologies;
		}

		// Check if there is data to plot
		if (
			selected_locations.length == 0 ||
			selected_years.length == 0 ||
			(selected_technologies.length == 0 && selected_variable != 'import_export') ||
			!data
		) {
			filtered_data = [];
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};
		let location_name = 'node';

		if (selected_variable == 'transport') {
			location_name = 'edge';
		}

		// Define which series should be aggregated and which should be shown separately, depending on the selected aggregation and variable.
		if (selected_variable == 'import_export') {
			dataset_selector[location_name] = selected_locations;
			datasets_aggregates['carrier'] = [selected_carrier!];
		} else if (selected_aggregation == 'technology') {
			dataset_selector[location_name] = selected_locations;
			datasets_aggregates['technology'] = selected_technologies;
		} else {
			dataset_selector['technology'] = selected_technologies;
			datasets_aggregates[location_name] = selected_locations;
		}

		// Filter years
		let excluded_years = years.filter((year) => !selected_years.includes(year));

		let filtered_result = data.data.filter(
			(a) => a.carrier === undefined || a.carrier == selected_carrier
		);

		// Aggregate data
		filtered_data = filter_and_aggregate_data(
			filtered_result,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == 'normalized'
		);
		labels = selected_years.map((year) => year.toString());

		// Define filename of the plot when downloading.
		let solution_names = selected_solution!.solution_name.split('.');
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			get_variable_name(get_local_variable()!, selected_solution?.version),
			selected_carrier
		].join('_');
	}
</script>

<h2>Production</h2>
<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:carriers
			bind:nodes
			bind:years
			bind:selected_solution
			bind:edges
			bind:loading={solution_loading}
			solution_selected={refetch}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Carrier Selection">
			{#if carriers.length > 0}
				<Dropdown
					label="Carrier"
					options={carriers.map((carrier) => ({
						label: stringify(carrier),
						value: carrier
					}))}
					bind:value={selected_carrier}
					disabled={solution_loading || fetching}
					onUpdate={() => {
						update_technologies();
						update_data();
					}}
				></Dropdown>
			{/if}
		</FilterSection>
		<FilterSection title="Production Component Selection">
			{#each Object.keys(variables) as key}
				<div class="row">
					<div class="col-6 col-md-3"><h3>{variables[key].title}</h3></div>
					<div class="col-4 col-md-2">
						<ToggleButton bind:value={variables[key].show} change={update_data}></ToggleButton>
					</div>

					{#if variables[key].show && key != 'carbon_emission'}
						<div class="col-6 col-md-2">Subdivision:</div>
						<div class="col-4 col-md-2">
							<ToggleButton bind:value={variables[key].subdivision} change={update_data}
							></ToggleButton>
						</div>
					{/if}
				</div>
			{/each}
		</FilterSection>
		<FilterSection title="Technology Selection">
			<h3>Conversion</h3>
			<h3>Storage</h3>
			<h3>Transport</h3>
		</FilterSection>
		{#if !fetching && selected_carrier && (technologies.length > 0 || selected_variable == 'import_export')}
			<FilterSection title="Data Selection">
				<div class="row">
					{#if selected_variable != 'import_export'}
						<div class="col-6">
							<Radio
								label="Aggregation"
								options={aggregation_options}
								bind:value={selected_aggregation}
								disabled={solution_loading || fetching}
								onUpdate={update_data}
							></Radio>
						</div>
					{/if}
					<div class="col-6">
						<Radio
							label="Normalisation"
							options={normalisation_options}
							bind:value={selected_normalisation}
							disabled={solution_loading || fetching}
							onUpdate={update_data}
						></Radio>
					</div>
				</div>
				{#if selected_aggregation == 'technology'}
					<AllCheckbox
						label="Technology"
						bind:value={selected_technologies}
						elements={technologies}
						disabled={solution_loading || fetching}
						onUpdate={update_data}
					></AllCheckbox>
				{:else}
					<AllCheckbox
						label="Node"
						bind:value={selected_locations}
						elements={locations}
						disabled={solution_loading || fetching}
						onUpdate={update_data}
					></AllCheckbox>
				{/if}
				<AllCheckbox
					label="Year"
					bind:value={selected_years}
					elements={years}
					disabled={solution_loading || fetching}
					onUpdate={update_data}
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
	{:else if selected_solution == null}
		<div></div>
	{:else if filtered_data == null}
		<div></div>
	{:else if technologies.length == 0 && selected_variable != 'import_export'}
		<div class="text-center">No technologies with this selection.</div>
	{:else if carriers.length == 0}
		<div class="text-center">No carriers with this selection.</div>
	{:else if filtered_data.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot config={plot_config} {plot_name}></BarPlot>
	{/if}
</div>
