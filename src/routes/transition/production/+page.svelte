<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import type { ActivatedSolution, Dataset, Row } from '$lib/types';
	import { filter_and_aggregate_data, remove_duplicates } from '$lib/utils';
	import BarPlot from '../../../components/BarPlot.svelte';

	import Radio from '../../../components/Radio.svelte';
	import { get_component_total } from '$lib/temple';
	import Papa from 'papaparse';
	import { get_variable_name } from '$lib/variables';
	import type { ChartConfiguration, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import Filters from '../../../components/Filters.svelte';
	import FilterSection from '../../../components/FilterSection.svelte';
	import Dropdown from '../../../components/Dropdown.svelte';
	import ToggleButton from '../../../components/ToggleButton.svelte';

	// Data
	let data: (Papa.ParseResult<any> | null)[] | null = $state(null);
	let filtered_data: any[] = $state([]);
	let units: Row[] = $state([]);

	// Filter options
	let carriers: string[] = $state([]);
	let technologies: string[] = $state([]);
	const normalisation_options = ['not_normalized', 'normalized'];
	let nodes: string[] = $state([]);
	let edges: string[] = $state([]);
	let locations: string[] = $state([]);
	let years: number[] = $state([]);

	let conversion_technologies: string[] = $state([]);
	let storage_technologies: string[] = $state([]);
	let transport_technologies: string[] = $state([]);

	// Variables
	interface Variable {
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
	let selected_variable: string | null = $state('conversion');
	let selected_subvariable: string | null = $state('input');
	let selected_carrier: string | null = $state(null);
	let selected_conversion_technologies: string[] = $state([]);
	let selected_storage_technologies: string[] = $state([]);
	let selected_technologies = $derived.by(() => [
		...selected_conversion_technologies,
		...selected_storage_technologies,
		...transport_technologies
	]);
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
	let unit = $derived.by(() => {
		let row = null;
		if (selected_technologies.length > 0) {
			row = units.find((u) => u.technology == selected_technologies[0]);
		}
		if (!row && selected_carrier) {
			row = units.find((u) => u.carrier == selected_carrier);
		}
		if (!row) return '';
		return row[0] || row.unit || '';
	});
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
						text: `${selected_variable} [${unit}]`
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

		// Fetch the data
		const promises = variables.flatMap((variable) => {
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
		});

		const responses = await Promise.all(promises);

		if (responses[0]?.unit?.data) {
			units = responses[0].unit.data;
		}

		data = responses.map((response) => {
			if (!response || !response.data) return null;
			return response.data;
		});
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

		carriers = remove_duplicates([
			...selected_solution!.detail.carriers_import,
			...selected_solution!.detail.carriers_export,
			...Object.values(selected_solution!.detail.carriers_input).flat(),
			...Object.values(selected_solution!.detail.carriers_output).flat(),
			...selected_solution!.detail.system.set_carriers
		]).sort();

		if ((carriers.length >= 1 && !selected_carrier) || !carriers.includes(selected_carrier!)) {
			selected_carrier = carriers[0];
		}

		reset_data_selection();
	}

	// TODO: Use Svelte derived properties to load the technology options
	// 		 But for that we also must adjust the update_data function to a derived property.
	// let conversion_technologies = $derived.by(() => {
	// 	if (!selected_solution) return [];
	// 	return remove_duplicates(
	// 		Object.entries(selected_solution!.detail.carriers_input)
	// 			.concat(Object.entries(selected_solution!.detail.carriers_output))
	// 			.filter((t) => selected_carrier && t[1].includes(selected_carrier))
	// 			.map((t) => t[0])
	// 	);
	// });
	// let storage_technologies = $derived.by(() => {
	// 	if (!selected_solution) return [];
	// 	return selected_solution.detail.system.set_storage_technologies.filter((t) => selected_solution?.detail.reference_carrier[t] == selected_carrier);
	// });
	// let transport_technologies = $derived.by(() => {
	// 	if (!selected_solution) return [];
	// 	return selected_solution.detail.system.set_transport_technologies.filter((t) => selected_solution?.detail.reference_carrier[t] == selected_carrier);
	// });

	// $effect(() => {
	// 	conversion_technologies;
	// 	untrack(() => {
	// 		selected_conversion_technologies = conversion_technologies;
	// 	});
	// });
	// $effect(() => {
	// 	storage_technologies;
	// 	untrack(() => {
	// 		selected_storage_technologies = storage_technologies;
	// 	});
	// });
	// $effect(() => {
	// 	transport_technologies;
	// 	untrack(() => {
	// 		selected_transport_technologies = transport_technologies;
	// 	});
	// });

	/**
	 * This function updates the available technologies given the currently selected solution and variable.
	 */
	function update_technologies() {
		if (selected_solution == null) {
			conversion_technologies = [];
			storage_technologies = [];
			transport_technologies = [];
			return;
		}

		conversion_technologies = remove_duplicates(
			Object.entries(selected_solution!.detail.carriers_input)
				.concat(Object.entries(selected_solution!.detail.carriers_output))
				.filter((t) => selected_carrier && t[1].includes(selected_carrier))
				.map((t) => t[0])
		);
		storage_technologies = selected_solution.detail.system.set_storage_technologies.filter(
			(t) => selected_solution?.detail.reference_carrier[t] == selected_carrier
		);
		transport_technologies = selected_solution.detail.system.set_transport_technologies.filter(
			(t) => selected_solution?.detail.reference_carrier[t] == selected_carrier
		);
		selected_conversion_technologies = conversion_technologies;
		selected_storage_technologies = storage_technologies;
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

	/**
	 * This function updates the plot data according to the current form selection.
	 */
	function update_data() {
		// Check if there is data to plot
		if (selected_locations.length == 0 || selected_years.length == 0 || !data || data.length == 0) {
			filtered_data = [];
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};
		let location_name = 'node';

		// Filter years
		let excluded_years = years.filter((year) => !selected_years.includes(year));

		filtered_data = variables.flatMap((variable, i) => {
			if (!variable.show || !data) {
				return [];
			}
			dataset_selector = { technology: [...selected_technologies, variable.title] };
			datasets_aggregates[location_name] = selected_locations;

			let filteredPos: Dataset[] = [];
			let curData = data[2 * i];
			if (variable.positive && curData !== null) {
				const filtered_result = group_data(
					curData.data.filter((a) => a.carrier === undefined || a.carrier == selected_carrier),
					variable,
					variable.filter_by_technologies ? selected_technologies : undefined
				);
				filteredPos = filter_and_aggregate_data(
					filtered_result,
					dataset_selector,
					datasets_aggregates,
					excluded_years,
					selected_normalisation == 'normalized',
					undefined,
					variable.positive_suffix || ''
				);
				if (!variable.subdivision && filteredPos.length > 0) {
					filteredPos[0].label = variable.positive_label;
				}
			}

			let filteredNeg: Dataset[] = [];
			curData = data[2 * i + 1];
			if (variable.negative && curData) {
				const filtered_result = group_data(
					curData.data.filter((a) => a.carrier === undefined || a.carrier == selected_carrier),
					variable,
					variable.filter_by_technologies ? selected_technologies : undefined
				);
				filteredNeg = filter_and_aggregate_data(
					filtered_result,
					dataset_selector,
					datasets_aggregates,
					excluded_years,
					selected_normalisation == 'normalized',
					undefined,
					variable.negative_suffix || ''
				).map((d) => {
					return {
						...d,
						data: Object.fromEntries(Object.entries(d.data).map(([k, e]) => [k, -e]))
					};
				});
				if (!variable.subdivision && filteredNeg.length > 0) {
					filteredNeg[0].label = variable.negative_label;
				}
			}

			return [...filteredPos, ...filteredNeg];
		});

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
						label: carrier,
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
			{#each variables as variable}
				<div class="row align-items-baseline">
					<div class="col-6 col-md-4"><h3>{variable.title}</h3></div>
					<div class="col-4 col-md-2">
						<ToggleButton bind:value={variable.show} change={update_data}></ToggleButton>
					</div>

					{#if variable.show && variable.show_subdivision}
						<div class="col-6 col-md-2">Subdivision:</div>
						<div class="col-4 col-md-2">
							<ToggleButton bind:value={variable.subdivision} change={update_data}></ToggleButton>
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
				onUpdate={update_data}
			></AllCheckbox>
			<AllCheckbox
				label="Storage"
				bind:value={selected_storage_technologies}
				elements={storage_technologies}
				disabled={solution_loading || fetching}
				onUpdate={update_data}
			></AllCheckbox>
		</FilterSection>
		{#if !fetching && selected_carrier != null}
			<FilterSection title="Data Selection">
				<Radio
					label="Normalisation"
					options={normalisation_options}
					bind:value={selected_normalisation}
					disabled={solution_loading || fetching}
					onUpdate={update_data}
				></Radio>
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
	{:else if carriers.length == 0}
		<div class="text-center">No carriers with this selection.</div>
	{:else if filtered_data.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<BarPlot config={plot_config} {plot_name}></BarPlot>
	{/if}
</div>
