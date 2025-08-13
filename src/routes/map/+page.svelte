<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ParseResult } from 'papaparse';

	import Radio from '$components/Radio.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import SolutionFilter from '$components/SolutionFilter.svelte';
	import MapPlot from '$components/MapPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import type { MapPlotData } from '$components/MapPlot.svelte';
	import type { ActivatedSolution, Row, System } from '$lib/types';

	import { get_component_total } from '$lib/temple';
	import { availableMaps } from '$lib/constants';
	import { remove_duplicates, to_options } from '$lib/utils';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';

	interface AggregatedData {
		[location: string]: { technology: string; years: number[] }[];
	}

	let plot = $state<MapPlot>();

	let fetchedData: ParseResult<Row> | null = $state(null);

	let years: number[] = $state([]);
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

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (selected_year == null || !years.includes(parseInt(selected_year)))) {
				selected_year = years[0].toString();
			}
		});
	});

	let carriers: string[] = $derived.by(() => {
		if (!fetchedData || !selected_solution || !selected_technology_type) {
			return [];
		}

		const technologies = all_technologies.concat(
			selected_solution.detail.system.set_transport_technologies
		);

		return remove_duplicates(
			fetchedData.data
				.map((element) => {
					const current_technology = element.technology;
					if (!technologies.includes(current_technology)) {
						return null;
					}
					return selected_solution!.detail.reference_carrier[current_technology];
				})
				.filter((carrier) => carrier != null)
		);
	});

	$effect(() => {
		carriers;
		untrack(() => {
			if (
				carriers.length > 0 &&
				(selected_carrier == null || !carriers.includes(selected_carrier))
			) {
				selected_carrier = carriers[0];
			}
		});
	});

	let technologies: string[] = $derived.by(() => {
		if (!selected_solution || !selected_technology_type) {
			return [];
		}

		return all_technologies.filter(
			(technology) => selected_solution!.detail.reference_carrier[technology] == selected_carrier
		);
	});

	let all_technologies: string[] = $derived.by(() => {
		if (!selected_solution || !selected_technology_type) {
			return [];
		}

		let key: keyof System = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selected_technology_type] as keyof System;

		if (!key) return [];

		return (selected_solution.detail.system[key] || []) as string[];
	});

	// Set URL parameters
	onMount(() => {
		selected_technology_type = get_url_param('technology_type') || selected_technology_type;
		selected_storage_type = get_url_param('storage_type') || selected_storage_type;
		selected_carrier = get_url_param('carrier') || selected_carrier;
	});

	$effect(() => {
		// Triggers
		selected_technology_type;
		selected_storage_type;
		selected_carrier;

		tick().then(() => {
			update_url_params({
				technology_type: selected_technology_type,
				storage_type: selected_technology_type === 'storage' ? selected_storage_type : null,
				carrier: selected_carrier
			});
		});
	});

	async function solution_changed() {
		await fetch_data();
		plot?.resetZoom();
	}

	async function fetch_data() {
		if (!selected_solution) {
			return;
		}

		fetching = true;
		fetchedData = null;

		const response = await get_component_total(
			selected_solution.solution_name,
			['capacity'],
			selected_solution.scenario_name,
			selected_solution.detail.system.reference_year,
			selected_solution.detail.system.interval_between_years
		);

		fetchedData = response.capacity;

		if (response.unit?.data) {
			units = Object.fromEntries(
				response.unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
		}

		fetching = false;
	}

	function aggregateDataByNode(
		technologies: string[],
		filter_capacity_type: string | null = null
	): AggregatedData | null {
		if (!fetchedData || !selected_solution || !selected_technology_type || !selected_carrier) {
			return null;
		}

		return fetchedData.data.reduce((acc: any, row) => {
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

	let data: AggregatedData | null = $derived.by(() => {
		if (!fetchedData || !selected_technology_type) {
			return null;
		}

		return aggregateDataByNode(
			technologies,
			selected_technology_type == 'storage' ? selected_storage_type : null
		);
	});

	let transportData: AggregatedData | null = $derived.by(() => {
		if (!selected_solution) {
			return null;
		}

		const transportTechnologies = selected_solution.detail.system.set_transport_technologies.filter(
			(technology) => selected_solution!.detail.reference_carrier[technology] == selected_carrier
		);
		return aggregateDataByNode(transportTechnologies);
	});

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
		if (!transportData || selected_year == null) {
			return null;
		}

		const index = years.findIndex((year) => year.toString() === selected_year);
		const entries = Object.entries(transportData).map(([location, data]) => {
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
		if (!transportData) {
			return [0, 0];
		}

		return Object.values(transportData).reduce(
			([accMin, accMax], values) => {
				const years = values.reduce((acc: number[] | null, { years }) => {
					if (!acc) return [...years];
					return acc.map((value, i) => Math.max(value, years[i] || 0));
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

<h1 class="mt-2 mb-4">The Map</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:years
			bind:selected_solution
			bind:loading={solution_loading}
			solution_selected={solution_changed}
			disabled={fetching || solution_loading}
		/>
	</FilterSection>
	{#if !solution_loading && selected_solution}
		<FilterSection title="Variable Selection">
			<FilterRow label="Technology Type">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={to_options(technology_types)}
						bind:value={selected_technology_type}
						disabled={fetching || solution_loading}
					></Dropdown>
				{/snippet}
			</FilterRow>
			{#if selected_technology_type == 'storage'}
				<FilterRow label="Storage Type">
					{#snippet content(formId)}
						<Radio
							{formId}
							options={to_options(storage_type_options)}
							bind:value={selected_storage_type}
							disabled={fetching || solution_loading}
						></Radio>
					{/snippet}
				</FilterRow>
			{/if}
			{#if selected_technology_type != null && carriers.length > 0}
				<FilterRow label="Carrier">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							options={to_options(carriers)}
							bind:value={selected_carrier}
							disabled={fetching || solution_loading}
						></Dropdown>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
		{#if fetchedData && selected_technology_type && selected_carrier}
			<FilterSection title="Data Selection">
				<FilterRow label="Year">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							bind:value={selected_year}
							options={to_options(years.map((year) => year.toString()))}
						></Dropdown>
					{/snippet}
				</FilterRow>
				<FilterRow label="Map">
					{#snippet content(formId)}
						<Dropdown {formId} bind:value={selected_map} options={maps}></Dropdown>
					{/snippet}
				</FilterRow>
			</FilterSection>
		{/if}
	{/if}
</Filters>

<div class="my-4 border rounded overflow-hidden">
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
