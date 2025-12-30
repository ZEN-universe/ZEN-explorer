<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ParseResult } from 'papaparse';

	import Radio from '$components/forms/Radio.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MapPlot from '$components/MapPlot.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import type { MapPlotData } from '$components/MapPlot.svelte';
	import type { ActivatedSolution, Row, System } from '$lib/types';

	import { fetchTotal } from '$lib/temple';
	import { availableMaps } from '$lib/constants';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import { removeDuplicates } from '$lib/utils';
	import WarningMessage from '$components/WarningMessage.svelte';

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

	//#region Functions and effects

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (selected_year == null || !years.includes(parseInt(selected_year)))) {
				selected_year = years[0].toString();
			}
		});
	});

	let carriers: string[] = $derived.by(() => {
		if (!selected_solution) {
			return [];
		}

		return removeDuplicates(Object.values(selected_solution.detail.reference_carrier)).sort();
	});

	$effect(() => {
		carriers;
		untrack(() => {
			if (selected_solution === null) return;
			if (selected_carrier !== null && !carriers.includes(selected_carrier)) {
				selected_carrier = null;
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

	//#endregion

	//#region Synchronize URL parameters

	// Set URL parameters
	onMount(() => {
		selected_technology_type = getURLParam('tech') || selected_technology_type;
		selected_storage_type = getURLParam('stor') || selected_storage_type;
		selected_carrier = getURLParam('car') || selected_carrier;
	});

	$effect(() => {
		// Triggers
		selected_technology_type;
		selected_storage_type;
		selected_carrier;

		tick().then(() => {
			updateURLParams({
				tech: selected_technology_type,
				stor: selected_technology_type === 'storage' ? selected_storage_type : null,
				car: selected_carrier
			});
		});
	});

	//#endregion

	//#region Data fetching and processing

	async function solutionUpdated() {
		if (!selected_solution) {
			return;
		}
		carrierUpdated();
	}

	let previous_carrier = '';
	$effect(() => {
		selected_carrier;
		untrack(() => {
			if (selected_carrier === previous_carrier) return;
			carrierUpdated();
		});
	});

	async function carrierUpdated() {
		previous_carrier = selected_carrier || '';
		await fetch_data();
		plot?.resetZoom();
	}

	async function fetch_data() {
		if (!selected_solution || !selected_carrier) {
			return;
		}

		fetching = true;
		fetchedData = null;

		const response = await fetchTotal(
			selected_solution.solution_name,
			['capacity'],
			selected_solution.scenario_name,
			selected_carrier
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

		return fetchedData.data.reduce(
			(acc: Record<string, { technology: string; years: number[] }[]>, row) => {
				const { technology, capacity_type, location } = row;

				if (
					!technologies.includes(technology) ||
					(filter_capacity_type && filter_capacity_type !== capacity_type)
				) {
					return acc;
				}

				const years = Object.entries(row)
					.filter(([key]) => !isNaN(parseInt(key)))
					.map(([, value]) => parseFloat(value));

				if (years.length === 0) {
					return acc;
				}

				acc[location] = acc[location] || [];
				acc[location].push({ technology, years: years });
				return acc;
			},
			{}
		);
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
			.filter(([, data]) => data.length > 0);
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

	//#endregion
</script>

<DiagramPage pageTitle="The Map" subtitle="Map of conversion, storage, and transport capacities">
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:years
				bind:selected_solution
				bind:loading={solution_loading}
				solutionSelected={solutionUpdated}
				disabled={fetching || solution_loading}
			/>
		</FilterSection>
		{#if !solution_loading && selected_solution}
			<FilterSection title="Variable Selection">
				<Dropdown
					options={carriers}
					bind:value={selected_carrier}
					label="Carrier"
					onUpdate={carrierUpdated}
					disabled={fetching || solution_loading}
				></Dropdown>
				{#if selected_carrier !== null}
					<Dropdown
						options={technology_types}
						bind:value={selected_technology_type}
						label="Technology Type"
						disabled={fetching || solution_loading}
					></Dropdown>
					{#if selected_technology_type == 'storage'}
						<Radio
							options={storage_type_options}
							bind:value={selected_storage_type}
							label="Storage Type"
							disabled={fetching || solution_loading}
						></Radio>
					{/if}
				{/if}
			</FilterSection>
			{#if selected_solution !== null && selected_carrier !== null}
				<FilterSection title="Data Selection">
					<Dropdown
						bind:value={selected_year}
						options={years.map((year) => year.toString())}
						label="Year"
					></Dropdown>
					<Dropdown bind:value={selected_map} options={maps} label="Map"></Dropdown>
				</FilterSection>
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		{#if plot}
			<div class="flex justify-end items-end h-full gap-4">
				<Button onclick={plot?.resetZoom}>
					<i class="bi bi-house me-2"></i>
					<div class="visually-hidden">Reset zoom</div>
				</Button>
				<Button onclick={plot?.downloadSVG}>
					<i class="bi bi-download me-2"></i>
					<div class="visually-hidden">Download SVG</div>
				</Button>
			</div>
		{/if}
	{/snippet}

	{#snippet mainContent()}
		{#if solution_loading || fetching}
			<Spinner></Spinner>
		{:else if !selected_solution}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if !selected_carrier}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if !pieData || !lineData || (Object.keys(pieData).length === 0 && Object.keys(lineData).length === 0)}
			<ErrorMessage message="No data to display for the selected options"></ErrorMessage>
		{:else}
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
	{/snippet}
</DiagramPage>
