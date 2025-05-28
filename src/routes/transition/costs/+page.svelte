<script lang="ts">
	import SolutionFilter from '../../../components/SolutionFilter.svelte';
	import type { ActivatedSolution, ComponentTotal, Dataset, Row } from '$lib/types';
	import AllCheckbox from '../../../components/AllCheckbox.svelte';
	import Radio from '../../../components/Radio.svelte';
	import ToggleButton from '../../../components/ToggleButton.svelte';
	import { get_variable_name } from '$lib/variables';

	import { get_component_total } from '$lib/temple';
	import { filter_and_aggregate_data, rename_field } from '$lib/utils';
	import { tick } from 'svelte';
	import BarPlot from '../../../components/BarPlot.svelte';
	import type { ChartConfiguration } from 'chart.js';
	import Filters from '../../../components/Filters.svelte';
	import FilterSection from '../../../components/FilterSection.svelte';

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
	let locations: string[] = $state([]);
	let transport_technologies: string[] = $state([]);
	let storage_technologies: string[] = $state([]);
	let conversion_technologies: string[] = $state([]);
	const aggregation_options: string[] = [combined_name, 'Location'];

	let selected_locations: string[] = $state([]);
	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_years: number[] = $state([]);
	let selected_normalisation: string = 'not_normalized';
	let selected_cost_carriers: string[] = $state([]);
	let selected_demand_carriers: string[] = $state([]);
	let selected_transport_technologies: string[] = $state([]);
	let selected_storage_technologies: string[] = $state([]);
	let selected_conversion_technologies: string[] = $state([]);
	let selected_aggregation: string = $state(aggregation_options[1]);

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let grouped_data: Row[] | undefined;
	let fetched_cost_carbon: ComponentTotal;
	let fetched_cost_carrier: ComponentTotal;
	let fetched_capex: ComponentTotal | undefined = $state();
	let fetched_opex: ComponentTotal;
	let fetched_cost_shed_demand: ComponentTotal;
	let units: { [carrier: string]: string } = $state({});

	let cost_carriers: string[] = $state([]);
	let demand_carriers: string[] = $state([]);

	let show_costs: { [name: string]: { title: string; show: boolean; subdivision: boolean } } =
		$state({
			capex: { title: 'Capex', show: true, subdivision: false },
			opex: { title: 'Opex', show: true, subdivision: false },
			carrier: { title: 'Carrier', show: true, subdivision: false },
			shed_demand: { title: 'Shed Demand', show: true, subdivision: false },
			carbon_emission: {
				title: 'Carbon Emissions',
				show: true,
				subdivision: false
			}
		});

	let plot_name = $state('plot');

	// Define initial plot config
	let filtered_data: any[] = $state([]);
	let plot_config: ChartConfiguration = $derived({
		type: 'line',
		data: { datasets: filtered_data },
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
						text: `Costs [${conversion_technologies.length > 0 ? units[conversion_technologies[0]] : ''}]`
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

	interface StringList {
		[key: string]: string[];
	}

	/**
	 * This funciton fetches all necessary cost-data  given the currently selected solution.
	 */
	async function fetch_data() {
		if (selected_solution == null) {
			return;
		}
		fetching = true;

		const [res_capex, res_opex, res_cost_carbon, res_cost_carrier, res_cost_shed_demand] =
			await Promise.all([
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name('capex_yearly', selected_solution.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				),
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name('opex_yearly', selected_solution.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				),
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name('cost_carbon_emissions_total', selected_solution.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				),
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name('cost_carrier', selected_solution.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				),
				get_component_total(
					selected_solution!.solution_name,
					get_variable_name('cost_shed_demand', selected_solution.version),
					selected_solution!.scenario_name,
					selected_solution!.detail.system.reference_year,
					selected_solution!.detail.system.interval_between_years
				)
			]);

		fetched_capex = res_capex;
		fetched_opex = res_opex;
		fetched_cost_carbon = res_cost_carbon;
		fetched_cost_carrier = res_cost_carrier;
		fetched_cost_shed_demand = res_cost_shed_demand;

		// "Standardize" all series names
		rename_field(fetched_cost_carrier.data!, 'node', 'location');
		rename_field(fetched_cost_shed_demand.data!, 'node', 'location');
		rename_field(fetched_opex.data!, 'technology', combined_name);
		rename_field(fetched_capex.data!, 'technology', combined_name);
		rename_field(fetched_cost_carrier.data!, 'carrier', combined_name);
		rename_field(fetched_cost_shed_demand.data!, 'carrier', combined_name);

		// Add Capex / Opex suffix
		for (let i in fetched_capex.data!.data) {
			fetched_capex.data!.data[i][combined_name] =
				fetched_capex.data!.data[i][combined_name] + capex_suffix;
		}
		for (let i in fetched_opex.data!.data) {
			fetched_opex.data!.data[i][combined_name] =
				fetched_opex.data!.data[i][combined_name] + opex_suffix;
		}

		if (fetched_capex.unit?.data) {
			units = Object.fromEntries(
				fetched_capex.unit.data.map((u) => [u.technology, u[0] || u.units])
			);
		}

		// Set available locations
		locations = Object.keys(selected_solution!.detail.edges).concat(
			selected_solution!.detail.system.set_nodes
		);

		fetching = false;
	}

	/**
	 * This function groups the data if subdivisons are active.
	 */
	function regroup_data(all_selected_carriers_technologies: string[]) {
		fetching = true;

		// This variable will contain all the datasets to plot
		grouped_data = new Array<Row>();

		let filtered_cost_carrier = structuredClone(fetched_cost_carrier.data);

		filtered_cost_carrier!.data = filtered_cost_carrier!.data.filter((i) =>
			selected_cost_carriers.includes(i[combined_name])
		);

		let filtered_fetched_cost_shed_demand = structuredClone(fetched_cost_shed_demand.data);

		filtered_fetched_cost_shed_demand!.data = filtered_fetched_cost_shed_demand!.data.filter((i) =>
			selected_demand_carriers.includes(i[combined_name])
		);

		if (fetched_capex != undefined && show_costs.capex.show) {
			// If the subdivision is active, no aggregation is necessary.
			if (show_costs.capex.subdivision) {
				grouped_data! = grouped_data!.concat(fetched_capex.data!.data);
			} else {
				console.log('Capex:', $state.snapshot(fetched_capex.data!.data));
				console.log('datasets_filters:', { location: selected_locations });
				console.log('datasets_aggregates:', {
					[combined_name]: all_selected_carriers_technologies
				});
				let new_data: { label: string; data: any; type: string }[] = filter_and_aggregate_data(
					fetched_capex.data!.data,
					{ location: selected_locations },
					{ [combined_name]: all_selected_carriers_technologies },
					[],
					false
				);
				console.log('Capex new data:', new_data);
				for (let i in new_data) {
					new_data[i].data['location'] = new_data[i].label;
					new_data[i].data[combined_name] = capex_label;
					grouped_data.push(new_data[i].data);
				}
				console.log('Capex grouped:', grouped_data);
			}
		}

		if (show_costs.opex.show) {
			// If the subdivision is active, no aggregation is necessary.
			if (show_costs.opex.subdivision) {
				grouped_data! = grouped_data!.concat(fetched_opex.data!.data);
			} else {
				let new_data: { label: string; data: any; type: string }[] = filter_and_aggregate_data(
					fetched_opex.data!.data,
					{ location: selected_locations },
					{ [combined_name]: all_selected_carriers_technologies },
					[],
					false
				);
				for (let i in new_data) {
					new_data[i].data['location'] = new_data[i].label;
					new_data[i].data[combined_name] = opex_label;
					grouped_data.push(new_data[i].data);
				}
			}
		}

		if (show_costs.carrier.show) {
			if (show_costs.carrier.subdivision) {
				grouped_data! = grouped_data!.concat(filtered_cost_carrier!.data);
			} else {
				let new_data: { label: string; data: any; type: string }[] = filter_and_aggregate_data(
					filtered_cost_carrier!.data,
					{ location: selected_locations },
					{ [combined_name]: all_selected_carriers_technologies },
					[],
					false
				);
				for (let i in new_data) {
					new_data[i].data['location'] = new_data[i].label;
					new_data[i].data[combined_name] = carrier_label;
					grouped_data.push(new_data[i].data);
				}
			}
		}

		if (show_costs.shed_demand.show) {
			if (show_costs.shed_demand.subdivision) {
				grouped_data! = grouped_data!.concat(filtered_fetched_cost_shed_demand!.data);
			} else {
				let new_data: { label: string; data: any; type: string }[] = filter_and_aggregate_data(
					filtered_fetched_cost_shed_demand!.data,
					{ location: selected_locations },
					{ [combined_name]: all_selected_carriers_technologies },
					[],
					false
				);
				for (let i in new_data) {
					new_data[i].data['location'] = new_data[i].label;
					new_data[i].data[combined_name] = shed_demand_label;
					grouped_data.push(new_data[i].data);
				}
			}
		}

		// If no data is available to show, reset everything.
		if (grouped_data!.length == 0) {
			grouped_data = undefined;
			fetching = false;
			return;
		}

		// TODO: Find out when and why this actually was used
		// Currently, this just removes labels once they are unselected, except if none are remaining.
		// let set_locations = new Set<string>();

		// Filter undefined datasets
		// grouped_data! = grouped_data!.filter((e) => {
		// 	return e != undefined;
		// });

		// for (const i of grouped_data!) {
		// 	set_locations.add(i['location']);
		// }

		// Update available locations
		// locations = Array.from(set_locations);
		fetching = false;
	}

	/**
	 * This function prepares all the necessary data for the plots based on the users selection in the form.
	 */
	function update_plot_data() {
		fetching = true;
		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		// Select all technologies and carriers
		let suffixed_technologies = [];
		for (const i of selected_conversion_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		for (const i of selected_storage_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		for (const i of selected_transport_technologies) {
			suffixed_technologies.push(i + capex_suffix);
			suffixed_technologies.push(i + opex_suffix);
		}

		let all_selected_carriers_technologies = [
			...suffixed_technologies,
			...selected_cost_carriers,
			...selected_demand_carriers
		];

		// Update the dataset aggregations and groupings
		regroup_data(all_selected_carriers_technologies);

		if (!show_costs.capex.subdivision) {
			all_selected_carriers_technologies.push(capex_label);
		}

		if (!show_costs.opex.subdivision) {
			all_selected_carriers_technologies.push(opex_label);
		}

		if (!show_costs.carrier.subdivision) {
			all_selected_carriers_technologies.push(carrier_label);
		}

		if (!show_costs.shed_demand.subdivision) {
			all_selected_carriers_technologies.push(shed_demand_label);
		}

		// Specify Aggregation. If the aggregation type is location, all technologies have to be aggregated and vice versa.
		if (selected_aggregation == aggregation_options[0]) {
			dataset_selector['location'] = locations;
			datasets_aggregates[combined_name] = all_selected_carriers_technologies;
		} else {
			dataset_selector[combined_name] = all_selected_carriers_technologies;
			datasets_aggregates['location'] = selected_locations;
		}

		// Define excluded years
		let excluded_years = years.filter((year) => !selected_years.includes(year));

		let normalized = selected_normalisation == 'normalized';
		filtered_data = [];

		// Get Plot-Data, as a base we now take the grouped data that are adapted to the subdivision selection.
		if (grouped_data) {
			filtered_data = filter_and_aggregate_data(
				grouped_data,
				dataset_selector,
				datasets_aggregates,
				excluded_years,
				normalized
			);
		}

		// Get Total Carbon Cost Data
		if (fetched_cost_carbon.data!.data.length > 0 && show_costs.carbon_emission.show) {
			filtered_data.push({
				label: 'Total Carbon Costs',
				data: fetched_cost_carbon.data!.data[0],
				type: 'bar'
			});
		}

		fetching = false;
	}

	/**
	 * This function is being called whenever the solution filter emits a solution changed event.
	 * It refetches the necessary data, defines all available data for the form, resets the form
	 */
	async function solution_changed() {
		if (selected_solution == null) {
			return;
		}
		await fetch_data();
		await tick();
		fetching = true;

		// Options for Capex / Opex
		let set_capex_opex_technologies = new Set<string>();

		if (fetched_capex != undefined) {
			for (const row of fetched_capex.data!.data) {
				set_capex_opex_technologies.add(row[combined_name].replace(capex_suffix, ''));
			}
		}
		for (const row of fetched_opex.data!.data) {
			set_capex_opex_technologies.add(row[combined_name].replace(opex_suffix, ''));
		}

		// Define available technologies of the different types
		transport_technologies = selected_solution!.detail.system.set_transport_technologies.filter(
			(t) => set_capex_opex_technologies.has(t)
		);
		conversion_technologies = selected_solution!.detail.system.set_conversion_technologies.filter(
			(t) => set_capex_opex_technologies.has(t)
		);
		storage_technologies = selected_solution!.detail.system.set_storage_technologies.filter((t) =>
			set_capex_opex_technologies.has(t)
		);

		// Reset selected technologies
		selected_transport_technologies = transport_technologies;
		selected_conversion_technologies = conversion_technologies;
		selected_storage_technologies = storage_technologies;

		// Options for Cost Carriers
		let set_cost_carriers = new Set<string>();

		for (const row of fetched_cost_carrier.data!.data) {
			set_cost_carriers.add(row[combined_name]);
		}

		carriers = selected_solution!.detail.system.set_carriers.slice();
		cost_carriers = selected_solution!.detail.carriers_import
			.concat(selected_solution!.detail.carriers_export)
			.filter((i) => set_cost_carriers.has(i));

		// Reset selected cost carriers
		selected_cost_carriers = cost_carriers;

		// Options for Demand Carriers
		let set_demand_carriers = new Set<string>();
		for (const row of fetched_cost_shed_demand.data!.data) {
			set_demand_carriers.add(row[combined_name]);
		}
		// TODO: Get the carriers from the available datasets (loaded in fetch_data)
		demand_carriers = selected_solution!.detail.carriers_demand.filter((i) =>
			set_demand_carriers.has(i)
		);

		// Reset selected demand carriers
		selected_demand_carriers = demand_carriers;

		// Set available nodes
		nodes = selected_solution!.detail.system.set_nodes;

		// Reset selected years
		selected_years = years;

		// Reset selected locations
		selected_locations = locations;

		// Update the plot
		update_plot_data();
		fetching = false;
		let solution_names = selected_solution!.solution_name.split('.');

		// Define the filename of the plot when downloading.
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			'costs'
		].join('_');
	}
</script>

<h2>Costs</h2>

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
			{#each Object.keys(show_costs) as key}
				<div class="row mb-2">
					<div class="col-6 col-md-3"><h3>{show_costs[key].title}</h3></div>
					<div class="col-4 col-md-2">
						<ToggleButton bind:value={show_costs[key].show} change={update_plot_data}
						></ToggleButton>
					</div>

					{#if show_costs[key].show && key != 'carbon_emission'}
						<div class="col-6 col-md-2">Subdivision:</div>
						<div class="col-4 col-md-2">
							<ToggleButton bind:value={show_costs[key].subdivision} change={update_plot_data}
							></ToggleButton>
						</div>
					{/if}
				</div>
			{/each}
		</FilterSection>
		<FilterSection title="Normalisation">
			<h3>Technologies (for Capex/Opex)</h3>
			{#if transport_technologies.length > 0}
				<AllCheckbox
					label="Transport"
					bind:value={selected_transport_technologies}
					elements={transport_technologies}
					onUpdate={() => {
						update_plot_data();
					}}
				></AllCheckbox>
			{/if}
			{#if storage_technologies.length > 0}
				<AllCheckbox
					label="Storage"
					bind:value={selected_storage_technologies}
					elements={storage_technologies}
					onUpdate={() => {
						update_plot_data();
					}}
				></AllCheckbox>
			{/if}
			{#if conversion_technologies.length > 0}
				<AllCheckbox
					label="Conversion"
					bind:value={selected_conversion_technologies}
					elements={conversion_technologies}
					onUpdate={() => {
						update_plot_data();
					}}
				></AllCheckbox>
			{/if}
			{#if cost_carriers.length > 0}
				<AllCheckbox
					label="Cost of Carrier"
					bind:value={selected_cost_carriers}
					elements={cost_carriers}
					onUpdate={() => {
						update_plot_data();
					}}
				></AllCheckbox>
			{/if}
			{#if demand_carriers.length > 0}
				<AllCheckbox
					label="Shed Demand"
					bind:value={selected_demand_carriers}
					elements={demand_carriers}
					onUpdate={() => {
						update_plot_data();
					}}
				></AllCheckbox>
			{/if}
		</FilterSection>
		<FilterSection title="Data Selection">
			<div class="row">
				<div class="col-6">
					<Radio
						label="Aggregation"
						options={aggregation_options}
						bind:value={selected_aggregation}
						onUpdate={(_) => update_plot_data()}
					></Radio>
				</div>
			</div>
			{#if selected_aggregation == aggregation_options[1]}
				<AllCheckbox
					label="Location"
					bind:value={selected_locations}
					elements={locations}
					onUpdate={(_) => update_plot_data()}
				></AllCheckbox>
			{/if}
			{#if selected_years}
				<AllCheckbox
					label="Year"
					bind:value={selected_years}
					elements={years}
					onUpdate={(_) => update_plot_data()}
				></AllCheckbox>
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
		{#if filtered_data.length == 0 || filtered_data[0].data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<BarPlot config={plot_config} {plot_name}></BarPlot>
		{/if}
	{/if}
</div>
