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
	let selected_map: string | null = $state('world-3');

	let solution_loading: boolean = $state(false);
	let fetching: boolean = $state(false);

	interface AggergatedData {
		[location: string]: { technology: string; years: number[] }[];
	}

	let fetched_data: Papa.ParseResult<Row> | null = $state(null);
	let data: AggergatedData | null = $state(null);
	let transport_data: AggergatedData | null = $state(null);

	let units: { [key: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacity_type = selected_technology_type == 'storage' ? selected_storage_type : 'power';
		return units[technologies[0] + '_' + capacity_type] || '';
	});

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
			units = Object.fromEntries(
				response.unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
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
		if (fetched_data === null || selected_technology_type === null || selected_solution === null) {
			return;
		}

		// Get the technologies for the current technology type and all transport technologies
		let all_technologies: string[] = get_technologies_by_type().concat(
			selected_solution.detail.system.set_transport_technologies
		);

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

	function aggregateDataByNode(technologies: string[], filter_capacity_type: string | null = null) {
		if (!fetched_data || !selected_solution || !selected_technology_type || !selected_carrier) {
			return null;
		}

		return fetched_data.data.reduce((acc: any, row) => {
			const { technology, capacity_type, location } = row;

			if (
				!technologies.includes(technology) ||
				(filter_capacity_type && filter_capacity_type !== capacity_type)
			) {
				return acc;
			}

			const years = Object.entries(row)
				.filter(([key, _]) => !isNaN(parseInt(key)))
				.map(([_, value]) => parseFloat(value));

			if (years.length === 0) {
				return acc;
			}

			acc[location] = acc[location] || [];
			acc[location].push({ technology, years: years });
			return acc;
		}, {});
	}

	function load_map_data() {
		if (!fetched_data || !selected_solution || !selected_technology_type || !selected_carrier) {
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

	let pieData: MapPlotData | null = $derived.by(() => {
		if (!data || selected_year == null) {
			return null;
		}

		const index = years.findIndex((year) => year.toString() === selected_year);
		const entries = Object.entries(data)
			.map(([location, data]) => {
				const mappedData = data
					.map((d) => ({ technology: d.technology, value: d.years[index] }))
					.filter((d) => d.value > 1e-6);
				return [location, mappedData];
			})
			.filter(([_location, data]) => data.length > 0);
		return Object.fromEntries(entries);
	});

	let lineData: MapPlotData | null = $derived.by(() => {
		if (!transport_data || selected_year == null) {
			return null;
		}

		const index = years.findIndex((year) => year.toString() === selected_year);
		const entries = Object.entries(transport_data).map(([location, data]) => {
			return [location, data.map((d) => ({ technology: d.technology, value: d.years[index] }))];
		});
		return Object.fromEntries(entries);
	});

	let [minTotal, maxTotal] = $derived.by(() => {
		if (!data) {
			return [0, 0];
		}
		return Object.values(data).reduce(
			([accMin, accMax], values) => {
				const years = values.reduce((acc: number[] | null, { years }) => {
					if (!acc) return [...years];
					return acc.map((value, i) => value + (years[i] || 0));
				}, null);

				if (years == null) {
					return [accMin, accMax];
				}

				const total = years.reduce((acc, val) => Math.max(acc, val), 0);
				return [Math.min(accMin, total), Math.max(accMax, total)];
			},
			[Number.MAX_SAFE_INTEGER, 0]
		);
	});

	let [minEdge, maxEdge] = $derived.by(() => {
		if (!transport_data) {
			return [0, 0];
		}

		return Object.values(transport_data).reduce(
			([accMin, accMax], values) => {
				const years = values.reduce((acc: number[] | null, { years }) => {
					if (!acc) return [...years];
					return acc.map((value, i) => Math.max(value, (years[i] || 0)));
				}, null);

				if (years == null) {
					return [accMin, accMax];
				}

				const total = years.reduce((acc, val) => Math.max(acc, val), 0);
				return [Math.min(accMin, total), Math.max(accMax, total)];
			},
			[Number.MAX_SAFE_INTEGER, 0]
		);
	});
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
	{#if pieData && lineData}
		<MapPlot
			bind:this={plot}
			{pieData}
			{lineData}
			{minTotal}
			{maxTotal}
			{minEdge}
			{maxEdge}
			nodeCoords={coords}
			{unit}
			map={selected_map}
		/>
	{/if}
</div>
