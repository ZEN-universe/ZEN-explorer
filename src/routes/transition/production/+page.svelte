<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { filter_and_aggregate_data } from '$lib/utils';
	import BarPlot from '../../../components/BarPlot.svelte';

	import Radio from '../../../components/Radio.svelte';
	import { get_component_total } from '$lib/temple';
	import { tick } from 'svelte';
	import Papa from 'papaparse';
	import { get_variable_name } from '$lib/variables';
	import type { ChartConfiguration } from 'chart.js';

	let data: Papa.ParseResult<any> | null = null;
	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);
	let edges: string[] = $state([]);
	let locations: string[] = $state([]);
	let years: number[] = $state([]);
	let variables: { [key: string]: string[] } = $state({
		conversion: ['input', 'output'],
		storage: ['charge', 'discharge'],
		transport: [],
		import_export: ['import', 'export']
	});
	const aggregation_options = ['technology', 'node'];
	let filtered_data: any[] = $state([]);
	let unit: Papa.ParseResult<any> | null = null;
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_variable: string | null = $state(null);
	let selected_carrier: string | null = $state(null);
	let technologies: string[] = $state([]);
	let selected_technologies: string[] = $state([]);
	let selected_locations: string[] = $state([]);
	let selected_subvariable: string | null = $state(null);
	let selected_years: number[] = $state([]);
	const normalisation_options = ['not_normalized', 'normalized'];
	let selected_normalisation: string = $state('not_normalized');
	let solution_loading: boolean = $state(false);
	let fetching = $state(false);
	let plot_name = $state('plot');

	interface StringList {
		[key: string]: string[];
	}

	let selected_aggregation = $state('node');

	// let datasets: any[] = $state([]);
	let labels: string[] = $state([]);
	let scaleYText: string = $derived(selected_variable + ' [' + get_unit() + ']');

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
						text: scaleYText
					}
				}
			}
		}
	});

	/**
	 * This function refetches the data from the API and then updates the carriers, technologies, locations and the plot.
	 */
	function refetch() {
		fetch_data().then(() => {
			update_carriers();
			update_technologies();
			update_locations();
			update_data();
		});
	}

	/**
	 * This function resets the selections of the form.
	 */
	function reset_data_selection() {
		selected_years = years;
		selected_locations = nodes;
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
	 * This function returns the unit of the currently selected carrier
	 */
	function get_unit() {
		if (unit === null) {
			return '';
		}
		for (const u of unit.data) {
			if (
				technologies[0] == u.technology &&
				(u.carrier == selected_carrier || u.carrier === undefined)
			) {
				return u[0];
			}
		}
		return '';
	}

	/**
	 * This function fetches the relevant data from the API server given the current selection
	 */
	async function fetch_data() {
		fetching = true;
		data = null;
		let variable_name = get_local_variable();
		if (variable_name === null) {
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
		unit = fetched.unit;
		fetching = false;
		return;
	}

	/**
	 * This function updates the available carriers depending on the current selection and resets the data selection.
	 */
	function update_carriers() {
		if (data == null) {
			carriers = [];
			return;
		}

		if (selected_solution == null) {
			carriers = [];
			return;
		}

		filtered_data = [];
		selected_carrier = '';

		let possible_technologies = new Set(data!.data.map((d) => d.technology));

		let possible_carriers = [
			...new Set(
				[...possible_technologies].map((d) => selected_solution?.detail.reference_carrier[d])
			)
		];

		if (selected_variable == 'import_export') {
			possible_carriers = [...new Set(data!.data.map((d) => d.carrier))];
		}

		switch (selected_variable) {
			case get_variable_name('import_export', selected_solution?.version):
				if (selected_subvariable == 'import') {
					carriers = selected_solution!.detail.carriers_import;
				} else {
					carriers = selected_solution!.detail.carriers_export;
				}
				break;
			case get_variable_name('conversion', selected_solution?.version):
				let relevant_carriers = selected_solution!.detail.carriers_output;
				if (selected_subvariable == 'input') {
					relevant_carriers = selected_solution!.detail.carriers_input;
				}
				carriers = [];

				for (const i in relevant_carriers) {
					carriers = [...new Set([...carriers, ...relevant_carriers[i]])];
				}

				break;
			default:
				carriers = selected_solution!.detail.system.set_carriers;
		}

		carriers = carriers.filter((d) => possible_carriers.includes(d));
		if (carriers.length == 1) {
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
		locations = nodes;
		if (selected_variable == 'transport') {
			locations = edges;
		}

		reset_data_selection();
	}

	/**
	 * This function is being called whenever the selected variable is changed.
	 * It resets the form according to the selected variable.
	 */
	function updated_variable() {
		filtered_data = [];

		if (selected_variable == null) {
			return;
		}

		if (variables[selected_variable] != null) {
			selected_subvariable = variables[selected_variable]![0];
		}

		if (selected_variable == 'import_export') {
			selected_aggregation = 'technology';
		}
	}

	/**
	 * This function updates the plot data according to the current form selection.
	 */
	function update_data() {
		if (selected_variable == 'import_export') {
			selected_aggregation = 'node';
		}

		// If the selected aggregation is technology, include all available nodes and vice versa
		if (selected_aggregation == 'technology') {
			selected_locations = nodes;
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
		} else {
			if (selected_aggregation == 'technology') {
				dataset_selector[location_name] = selected_locations;
				datasets_aggregates['technology'] = selected_technologies;
			} else {
				dataset_selector['technology'] = selected_technologies;
				datasets_aggregates[location_name] = selected_locations;
			}
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

		// Set data in plot config
		// datasets = filtered_data;
		// scaleYText = selected_variable + ' [' + get_unit() + ']';

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
<div class="z-1 position-relative">
	<div class="filters">
		<div class="accordion" id="accordionExample">
			<div class="accordion-item solution-selection">
				<h2 class="accordion-header">
					<button
						class="accordion-button"
						type="button"
						data-bs-toggle="collapse"
						data-bs-target="#collapseOne"
						aria-expanded="true"
						aria-controls="collapseOne"
					>
						Solution Selection
					</button>
				</h2>
				<div id="collapseOne" class="accordion-collapse collapse show">
					<div class="accordion-body">
						<SolutionFilter
							bind:carriers
							bind:nodes
							bind:years
							bind:selected_solution
							bind:edges
							bind:loading={solution_loading}
							solution_selected={refetch}
							enabled={!solution_loading && !fetching}
						/>
					</div>
				</div>
			</div>

			{#if !solution_loading && selected_solution}
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseTwo"
							aria-expanded="false"
							aria-controls="collapseTwo"
						>
							Variable Selection
						</button>
					</h2>
					<div id="collapseTwo" class="accordion-collapse collapse show">
						<div class="accordion-body">
							<h3>Variable</h3>
							<select
								class="form-select"
								bind:value={selected_variable}
								disabled={solution_loading || fetching}
								onchange={() => {
									updated_variable();
									refetch();
								}}
							>
								{#each Object.entries(variables) as [variable, subvalues]}
									<option value={variable}>
										{variable}
									</option>
								{/each}
							</select>
							{#if variables && selected_variable && variables[selected_variable] != null}
								<h3>Subvariable</h3>
								<Radio
									options={variables[selected_variable]}
									bind:selected_option={selected_subvariable}
									selection_changed={(_) => refetch()}
									enabled={!solution_loading && !fetching}
								></Radio>
							{/if}
							{#if selected_variable != null && carriers.length > 0}
								<h3>Carrier</h3>
								<select
									bind:value={selected_carrier}
									onchange={() => {
										update_technologies();
										update_data();
									}}
									disabled={solution_loading || fetching}
								>
									{#each carriers as carrier}
										<option value={carrier}>
											{carrier}
										</option>
									{/each}
								</select>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			{#if !fetching && selected_carrier && (technologies.length > 0 || selected_variable == 'import_export')}
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseThree"
							aria-expanded="false"
							aria-controls="collapseThree"
						>
							Data Selection
						</button>
					</h2>
					<div id="collapseThree" class="accordion-collapse collapse show">
						<div class="accordion-body">
							<div class="row">
								{#if selected_variable != 'import_export'}
									<div class="col-6">
										<h3>Aggregation</h3>
										<Radio
											options={aggregation_options}
											bind:selected_option={selected_aggregation}
											selection_changed={(_) => update_data()}
											enabled={!solution_loading && !fetching}
										></Radio>
									</div>
								{/if}
								<div class="col-6">
									<h3>Normalisation</h3>
									<Radio
										options={normalisation_options}
										bind:selected_option={selected_normalisation}
										selection_changed={(_) => update_data()}
										enabled={!solution_loading && !fetching}
									></Radio>
								</div>
							</div>
							{#if selected_aggregation == 'technology'}
								<h3>Technology</h3>
								<AllCheckbox
									bind:selected_elements={selected_technologies}
									elements={technologies}
									enabled={!solution_loading && !fetching}
									selection_changed={() => {
										update_data();
									}}
								></AllCheckbox>
							{:else}
								<h3>Node</h3>
								<AllCheckbox
									bind:selected_elements={selected_locations}
									elements={locations}
									enabled={!solution_loading && !fetching}
									selection_changed={(e) => {
										update_data();
									}}
								></AllCheckbox>
							{/if}
							<h3>Year</h3>
							<AllCheckbox
								bind:selected_elements={selected_years}
								elements={years}
								enabled={!solution_loading && !fetching}
								selection_changed={(e) => {
									update_data();
								}}
							></AllCheckbox>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
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
