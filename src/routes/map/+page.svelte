<script lang="ts">
	import Radio from '../../components/Radio.svelte';
	import Dropdown from '../../components/Dropdown.svelte';
	import SolutionFilter from '../../components/SolutionFilter.svelte';
	import MapPlot from '../../components/MapPlot.svelte';
	import { get_component_total } from '$lib/temple';
	import { availableMaps } from '$lib/constants';

	import type { MapPlotData } from '../../components/MapPlot.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';
	import Filters from '../../components/Filters.svelte';
	import FilterSection from '../../components/FilterSection.svelte';

	let plot = $state<MapPlot>();

	let carriers: string[] = $state([]);
	let years: number[] = $state([]);
	let technologies: string[] = $state([]);
	let technology_types: string[] = ['conversion', 'storage'];
	const storage_type_options = ['energy', 'power'];
	const maps: string[] = availableMaps;

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_technology_type: string = $state('conversion');
	let selected_storage_type = $state('energy');
	let selected_carrier: string | null = $state(null);
	let selected_year: number | null = $state(null);
	let selected_map: string | null = $state('nuts-1');

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let fetched_data: Papa.ParseResult<Row> | null = $state(null);
	let data: MapPlotData | null = $state(null);
	let transport_data: MapPlotData | null = $state(null);

	let units: { [key: string]: string } = $state({});
	let unit: string = $derived(units[technologies[0]] || '');

	let coords: { [key: string]: [number, number] } = $derived.by(() => {
		if (selected_solution == null) {
			return {};
		}
		return Object.entries(selected_solution.detail.system.coords).reduce(
			(acc, [node, { lat, lon }]) => ({ ...acc, [node]: [lon, lat] }),
			{}
		);
	});

	async function fetch_data() {
		if (!selected_solution) {
			return;
		}

		fetching = true;
		fetched_data = null;

		const response = await get_component_total(
			selected_solution.solution_name,
			'capacity',
			selected_solution.scenario_name,
			selected_solution.detail.system.reference_year,
			selected_solution.detail.system.interval_between_years
		);

		fetched_data = response.data;

		if (response.unit?.data) {
			units = Object.fromEntries(response.unit.data.map((u) => [u.technology, u[0] || u.units]));
		}

		fetching = false;
	}

	async function solution_changed() {
		selected_carrier = null;
		await fetch_data();
		selected_year = years.length > 0 ? years[0] : null;
		technology_type_changed();
		plot?.resetZoom();
	}

	function technology_type_changed() {
		update_carriers();
		update_technologies();
		load_map_data();
	}

	function carrier_changed() {
		update_technologies();
		load_map_data();
	}

	function year_changed() {
		load_map_data();
	}

	function update_carriers() {
		carriers = [];
		if (fetched_data === null || selected_technology_type === null) {
			return;
		}

		// Get the technologies for the current technology type
		let all_technologies: string[] = get_technologies_by_type();

		// Add all the available carriers to the set of carriers for the current set of technologies
		fetched_data.data.forEach((element) => {
			let current_technology = element.technology;
			let current_carrier = selected_solution!.detail.reference_carrier[current_technology];

			if (!carriers.includes(current_carrier) && all_technologies.includes(element.technology)) {
				carriers.push(current_carrier);
			}
		});

		if ((selected_carrier == null || !carriers.includes(selected_carrier)) && carriers.length > 0) {
			selected_carrier = carriers[0];
		}
	}

	/**
	 * This function updates the available technologies depending on the currently selected carrier and resets the currently selected technologies.
	 */
	function update_technologies() {
		if (selected_technology_type === null) {
			return;
		}

		technologies = get_technologies_by_type().filter(
			(technology) => selected_solution?.detail.reference_carrier[technology] == selected_carrier
		);
	}

	function get_technologies_by_type() {
		if (!selected_solution || !selected_technology_type) {
			return [];
		}

		switch (selected_technology_type) {
			case 'conversion':
				return selected_solution.detail.system.set_conversion_technologies;
			case 'storage':
				return selected_solution.detail.system.set_storage_technologies;
			case 'transport':
				return selected_solution.detail.system.set_transport_technologies;
		}

		return [];
	}

	function aggregateDataByNode(
		technologies: string[],
		filter_capacity_type: string | null = null
	): MapPlotData | null {
		if (
			!fetched_data ||
			!selected_solution ||
			!selected_technology_type ||
			!selected_carrier ||
			!selected_year
		) {
			return null;
		}

		return fetched_data.data.reduce((acc: any, row) => {
			const { technology, capacity_type, location } = row;
			const value = parseFloat(row[selected_year!]);

			if (
				!technologies.includes(technology) ||
				(filter_capacity_type && filter_capacity_type !== capacity_type) ||
				value < 1e-6
			) {
				return acc;
			}

			acc[location] = acc[location] || [];
			acc[location].push({ technology, value });
			return acc;
		}, {});
	}

	function load_map_data() {
		if (
			!fetched_data ||
			!selected_solution ||
			!selected_technology_type ||
			!selected_carrier ||
			!selected_year
		) {
			return;
		}

		data = aggregateDataByNode(
			technologies,
			selected_technology_type == 'storage' ? selected_storage_type : null
		);

		const transportTechnologies = selected_solution.detail.system.set_transport_technologies.filter(
			(technology) => selected_solution!.detail.reference_carrier[technology] == selected_carrier
		);
		transport_data = aggregateDataByNode(transportTechnologies);
	}
</script>

<h1>Map</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:years
			bind:selected_solution
			bind:loading={solution_loading}
			solution_selected={solution_changed}
			enabled={!fetching && !solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Variable Selection">
			<Dropdown
				label="Technology Type"
				options={technology_types}
				bind:value={selected_technology_type}
				disabled={fetching || solution_loading}
				onUpdate={technology_type_changed}
			></Dropdown>
			{#if selected_technology_type == 'storage'}
				<Radio
					label=""
					options={storage_type_options}
					bind:value={selected_storage_type}
					onUpdate={technology_type_changed}
					disabled={!fetching && !solution_loading}
				></Radio>
			{/if}
			{#if selected_technology_type != null && carriers.length > 0}
				<Dropdown
					label="Carrier"
					options={carriers}
					bind:value={selected_carrier}
					disabled={fetching || solution_loading}
					onUpdate={carrier_changed}
				></Dropdown>
			{/if}
		</FilterSection>
		{#if fetched_data && selected_technology_type && selected_carrier}
			<FilterSection title="Data Selection">
				<Dropdown label="Year" bind:value={selected_year} options={years} onUpdate={year_changed}
				></Dropdown>
				<Dropdown label="Map" bind:value={selected_map} options={maps}></Dropdown>
			</FilterSection>
		{/if}
	{/if}
</Filters>

<div class="my-4">
	{#if data && transport_data}
		<MapPlot
			bind:this={plot}
			pieData={data}
			lineData={transport_data}
			nodeCoords={coords}
			{unit}
			map={selected_map}
		/>
	{/if}
</div>
