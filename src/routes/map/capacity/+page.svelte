<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import Radio from '$components/forms/Radio.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MapPlot from '$components/MapPlot.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import type { MapPlotData } from '$components/MapPlot.svelte';
	import type { ActivatedSolution, System } from '$lib/types';

	import { fetchTotal } from '$lib/temple';
	import { availableMaps } from '$lib/constants';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import { removeDuplicates } from '$lib/utils';
	import WarningMessage from '$components/WarningMessage.svelte';
	import Entries, { type FilterCriteria } from '@/lib/entries';

	type AggregatedData = Record<string, { technology: string; years: number[] }[]>;

	let plot = $state<MapPlot>();

	let fetchedData: Entries | null = $state(null);

	let years: number[] = $state([]);
	let technologyTypes: string[] = ['conversion', 'storage'];
	const storageTypeOptions = ['energy', 'power'];
	const maps: { label: string; value: string }[] = availableMaps;

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedTechnologyType: string = $state('conversion');
	let selectedStorageType = $state('energy');
	let selectedCarrier: string | null = $state(null);
	let selectedYear: string | null = $state(null);
	let selectedMap: string | null = $state('world-3');

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let units: { [key: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacityType = selectedTechnologyType == 'storage' ? selectedStorageType : 'power';
		return units[technologies[0] + '_' + capacityType] || '';
	});

	let coords: { [key: string]: [number, number] } = $derived.by(() => {
		if (selectedSolution == null) {
			return {};
		}
		return Object.entries(selectedSolution.detail.system.coords).reduce(
			(acc, [node, { lat, lon }]) => ({ ...acc, [node]: [lon, lat] }),
			{}
		);
	});

	//#region Functions and effects

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (selectedYear == null || !years.includes(parseInt(selectedYear)))) {
				selectedYear = years[0].toString();
			}
		});
	});

	let carriers: string[] = $derived.by(() => {
		if (!selectedSolution) {
			return [];
		}

		return removeDuplicates(Object.values(selectedSolution.detail.reference_carrier)).sort();
	});

	$effect(() => {
		carriers;
		untrack(() => {
			if (selectedSolution === null) return;
			if (selectedCarrier !== null && !carriers.includes(selectedCarrier)) {
				selectedCarrier = null;
			}
		});
	});

	let technologies: string[] = $derived.by(() => {
		if (!selectedSolution || !selectedTechnologyType) {
			return [];
		}

		return allTechnologies.filter(
			(technology) => selectedSolution!.detail.reference_carrier[technology] == selectedCarrier
		);
	});

	let allTechnologies: string[] = $derived.by(() => {
		if (!selectedSolution || !selectedTechnologyType) {
			return [];
		}

		let key: keyof System = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selectedTechnologyType] as keyof System;

		if (!key) return [];

		return (selectedSolution.detail.system[key] || []) as string[];
	});

	//#endregion

	//#region Synchronize URL parameters

	// Set URL parameters
	onMount(() => {
		selectedTechnologyType = getURLParam('tech') || selectedTechnologyType;
		selectedStorageType = getURLParam('stor') || selectedStorageType;
		selectedCarrier = getURLParam('car') || selectedCarrier;
	});

	$effect(() => {
		// Triggers
		selectedTechnologyType;
		selectedStorageType;
		selectedCarrier;

		tick().then(() => {
			updateURLParams({
				tech: selectedTechnologyType,
				stor: selectedTechnologyType === 'storage' ? selectedStorageType : null,
				car: selectedCarrier
			});
		});
	});

	//#endregion

	//#region Data fetching and processing

	async function solutionUpdated() {
		if (!selectedSolution) {
			return;
		}
		carrierUpdated();
	}

	let previousCarrier = '';
	$effect(() => {
		selectedCarrier;
		untrack(() => {
			if (selectedCarrier === previousCarrier) return;
			carrierUpdated();
		});
	});

	async function carrierUpdated() {
		previousCarrier = selectedCarrier || '';
		await fetchData();
		plot?.resetZoom();
	}

	async function fetchData() {
		if (!selectedSolution || !selectedCarrier) {
			return;
		}

		fetching = true;

		const response = await fetchTotal(
			selectedSolution.solution_name,
			['capacity'],
			selectedSolution.scenario_name,
			selectedCarrier
		);

		fetchedData = Entries.fromRows(response.capacity?.data || []);

		if (response.unit?.data) {
			units = Object.fromEntries(
				response.unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
		}

		fetching = false;
	}

	function aggregateDataByNode(
		technologies: string[],
		filterCapacityType: string | null = null
	): AggregatedData | null {
		if (!fetchedData || !selectedSolution || !selectedTechnologyType || !selectedCarrier) {
			return null;
		}

		let criteria: FilterCriteria = { technology: technologies };
		if (filterCapacityType) {
			criteria['capacity_type'] = [filterCapacityType];
		}

		return fetchedData.filterByCriteria(criteria).reduce(
			(acc, { data, index: { location, technology } }) => {
				acc[location] = acc[location] || [];
				acc[location].push({ technology, years: data });
				return acc;
			},
			{} as Record<string, { technology: string; years: number[] }[]>
		);
	}

	let data: AggregatedData | null = $derived.by(() => {
		if (!fetchedData || !selectedTechnologyType) {
			return null;
		}

		return aggregateDataByNode(
			technologies,
			selectedTechnologyType == 'storage' ? selectedStorageType : null
		);
	});

	let transportData: AggregatedData | null = $derived.by(() => {
		if (!selectedSolution) {
			return null;
		}

		const transportTechnologies = selectedSolution.detail.system.set_transport_technologies.filter(
			(technology) => selectedSolution!.detail.reference_carrier[technology] == selectedCarrier
		);
		return aggregateDataByNode(transportTechnologies);
	});

	let pieData: MapPlotData | null = $derived.by(() => {
		if (!data || selectedYear == null) {
			return null;
		}

		const index = years.findIndex((year) => year.toString() === selectedYear);
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
		if (!transportData || selectedYear == null) {
			return null;
		}

		const index = years.findIndex((year) => year.toString() === selectedYear);
		const entries = Object.entries(transportData).map(([location, data]) => {
			return [location, data.map(({technology, years}) => ({ technology, value: years[index] }))];
		});
		return Object.fromEntries(entries);
	});

	let [minTotal, maxTotal] = $derived.by(() => {
		if (!data) {
			return [0, 0];
		}
		return Object.values(data).reduce(
			([accMin, accMax], values) => {
				// Sum values for each year across all technologies for each node
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
				// Find max edge value for each year across all technologies
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

<DiagramPage
	parentTitle="The Map"
	pageTitle="Capacity"
	subtitle="Map of conversion, storage, and transport capacities"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:years
				bind:selected_solution={selectedSolution}
				bind:loading={solutionLoading}
				solutionSelected={solutionUpdated}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && selectedSolution}
			<FilterSection title="Variable Selection">
				<Dropdown
					options={carriers}
					bind:value={selectedCarrier}
					label="Carrier"
					onUpdate={carrierUpdated}
					disabled={fetching || solutionLoading}
				></Dropdown>
				{#if selectedCarrier !== null}
					<Dropdown
						options={technologyTypes}
						bind:value={selectedTechnologyType}
						label="Technology Type"
						disabled={fetching || solutionLoading}
					></Dropdown>
					{#if selectedTechnologyType == 'storage'}
						<Radio
							options={storageTypeOptions}
							bind:value={selectedStorageType}
							label="Storage Type"
							disabled={fetching || solutionLoading}
						></Radio>
					{/if}
				{/if}
			</FilterSection>
			{#if selectedSolution !== null && selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<Dropdown
						bind:value={selectedYear}
						options={years.map((year) => year.toString())}
						label="Year"
					></Dropdown>
					<Dropdown bind:value={selectedMap} options={maps} label="Map"></Dropdown>
				</FilterSection>
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		{#if plot}
			<div class="flex h-full items-end justify-end gap-4">
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
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if !selectedSolution}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if !selectedCarrier}
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
				map={selectedMap}
			/>
		{/if}
	{/snippet}
</DiagramPage>
