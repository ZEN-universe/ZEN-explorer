<script lang="ts">
	import Radio from '../../components/Radio.svelte';
	import Dropdown from '../../components/Dropdown.svelte';
	import SolutionFilter from '../../components/SolutionFilter.svelte';
	import MapPlot from '../../components/MapPlot.svelte';
	import { get_component_total } from '$lib/temple';
	import { availableMaps } from '$lib/constants';

	import type { MapPlotData } from '../../components/MapPlot.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';

	let plot = $state<MapPlot>();

	let carriers: string[] = $state([]);
	let years: number[] = $state([]);
	let technologies: string[] = $state([]);
	let technology_types: string[] = ['conversion', 'storage'];
	const storage_type_options = ['energy', 'power'];
	const maps: { label: string; value: string }[] = availableMaps;

	let selected_solution: ActivatedSolution | null = $state(null);
	let selected_technology_type: string = $state('conversion');
	let selected_storage_type = $state('energy');
	let selected_carrier: string | null = $state(null);
	let selected_year: string | null = $state(null);
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
		selected_year = years.length > 0 ? years[0].toString() : null;
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
							bind:years
							bind:selected_solution
							bind:loading={solution_loading}
							solution_selected={solution_changed}
							enabled={!fetching && !solution_loading}
						/>
					</div>
				</div>
			</div>
			{#if !solution_loading && selected_solution}
				<div class="accordion-item variable-selection">
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
							<h3>Technology Type</h3>
							<select
								class="form-select"
								bind:value={selected_technology_type}
								onchange={technology_type_changed}
								disabled={fetching || solution_loading}
							>
								{#each technology_types as technology_type}
									<option value={technology_type}>
										{technology_type}
									</option>
								{/each}
							</select>
							{#if selected_technology_type == 'storage'}
								<Radio
									options={storage_type_options}
									bind:selected_option={selected_storage_type}
									selection_changed={technology_type_changed}
									enabled={!fetching && !solution_loading}
								></Radio>
							{/if}
							{#if selected_technology_type != null && carriers.length > 0}
								<h3>Carrier</h3>
								<select
									class="form-select"
									bind:value={selected_carrier}
									onchange={carrier_changed}
									disabled={fetching || solution_loading}
								>
									{#each carriers as carrier}
										<option value={carrier}>
											{carrier}
										</option>
									{/each}
									disabled={fetching || solution_loading}
								</select>
							{/if}
						</div>
					</div>
				</div>
				{#if fetched_data && selected_technology_type && selected_carrier}
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
								<h3>Year</h3>
								<Dropdown
									bind:selected_option={selected_year}
									options={years.map((year) => ({
										label: year.toString(),
										value: year.toString()
									}))}
									selection_changed={year_changed}
								></Dropdown>
								<h3>Map</h3>
								<Dropdown bind:selected_option={selected_map} options={maps}></Dropdown>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

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
