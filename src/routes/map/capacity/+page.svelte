<script lang="ts">
	import Radio from '$components/forms/Radio.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MapPlot from '$components/MapPlot.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';

	import type { ActivatedSolution, System } from '$lib/types';
	import { fetchTotal } from '$lib/temple';
	import { availableMaps } from '$lib/constants';
	import { removeDuplicates } from '$lib/utils';
	import Entries from '@/lib/entries';

	import {
		computePieData,
		computeLineData,
		type TechnologyType,
		type StorageType
	} from './processData';
	import { onValueChange } from '@/lib/onValueChange.svelte';

	// ======================================
	// State variables
	// ======================================

	let plot = $state<MapPlot>();

	let fetchedData: Entries | null = $state(null);

	let years: number[] = $state([]);
	const technologyTypes: TechnologyType[] = ['conversion', 'storage'];
	const storageTypeOptions: StorageType[] = ['energy', 'power'];
	const maps: { label: string; value: string }[] = availableMaps;

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedTechnologyType: TechnologyType = $state('conversion');
	let selectedStorageType: StorageType = $state('energy');
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

	let carriers: string[] = $derived.by(() =>
		removeDuplicates(Object.values(selectedSolution?.detail.reference_carrier || {})).sort()
	);

	let technologies: string[] = $derived.by(() => {
		if (!selectedSolution) return [];

		let key: keyof System = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies'
		}[selectedTechnologyType] as keyof System;
		if (!key) return [];

		const allTechnologies = (selectedSolution.detail.system[key] || []) as string[];
		return allTechnologies.filter(
			(technology) => selectedSolution!.detail.reference_carrier[technology] == selectedCarrier
		);
	});

	// ======================================
	// Refresh data when selection changes
	// ======================================

	onValueChange(() => selectedCarrier, refreshData);

	async function refreshData() {
		await fetchData();
		plot?.resetZoom();
	}

	// ======================================
	// Fetch Data
	// ======================================

	async function fetchData() {
		if (!selectedSolution || !selectedCarrier) {
			return;
		}

		fetching = true;

		const { capacity: capacityResponse, unit: unitResponse } = await fetchTotal(
			selectedSolution.solution_name,
			['capacity'],
			selectedSolution.scenario_name,
			selectedCarrier
		);

		fetchedData = Entries.fromRows(capacityResponse?.data || []);
		units = Object.fromEntries(
			unitResponse?.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units]) || []
		);

		fetching = false;
	}

	// ======================================
	// Process data
	// ======================================

	let [pieData, minTotal, maxTotal] = $derived(
		computePieData(
			fetchedData,
			years,
			technologies,
			selectedYear,
			selectedStorageType,
			selectedTechnologyType
		)
	);
	let [lineData, minEdge, maxEdge] = $derived(
		computeLineData(fetchedData, years, selectedSolution, selectedCarrier, selectedYear)
	);
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
				solutionSelected={refreshData}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && selectedSolution}
			<FilterSection title="Variable Selection">
				<Dropdown
					options={carriers}
					bind:value={selectedCarrier}
					label="Carrier"
					onUpdate={refreshData}
					disabled={fetching || solutionLoading}
					unsetIfInvalid
					urlParam="carrier"
				></Dropdown>
				{#if selectedCarrier !== null}
					<Dropdown
						options={technologyTypes}
						bind:value={selectedTechnologyType}
						label="Technology Type"
						disabled={fetching || solutionLoading}
						urlParam="tech"
					></Dropdown>
				{/if}
				{#if selectedCarrier !== null && selectedTechnologyType === 'storage'}
					<Radio
						options={storageTypeOptions}
						bind:value={selectedStorageType}
						label="Storage Type"
						disabled={fetching || solutionLoading}
						urlParam="stor"
					></Radio>
				{/if}
			</FilterSection>
			{#if selectedSolution !== null && selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<Dropdown
						bind:value={selectedYear}
						options={years.map((year) => year.toString())}
						label="Year"
						unsetIfInvalid
						default={years.length > 0 ? years[0].toString() : null}
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
				systemCoords={selectedSolution.detail.system.coords}
				{unit}
				map={selectedMap}
			/>
		{/if}
	{/snippet}
</DiagramPage>
