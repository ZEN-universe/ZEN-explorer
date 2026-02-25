<script lang="ts">
	import type { ActivatedSolution } from '$lib/types';
	import { availableMaps } from '$lib/constants';
	import { removeDuplicates } from '$lib/utils';
	import { fetchProductionData, type ProductionComponent } from '@/lib/productionData';
	import Entries from '@/lib/entries';
	import { onValueChange } from '@/lib/onValueChange.svelte';

	import Dropdown from '$components/forms/Dropdown.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MapPlot from '$components/MapPlot.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import type { MapPlotData } from '$components/MapPlot.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';

	import { computeLineData, computePieData, type EnergyType } from './processData';

	// ======================================
	// State variables
	// ======================================

	let plot = $state<MapPlot>();

	let productionData: Record<ProductionComponent, Entries> | null = $state(null);

	const energyTypes: EnergyType[] = ['production', 'consumption'];
	let years: number[] = $state([]);

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedCarrier: string | null = $state(null);
	let selectedEnergyType: EnergyType = $state('production');
	let selectedYear: string | null = $state(null);
	let selectedMap: string | null = $state('world-3');

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let units: { carrier: string; 0?: string; units?: string }[] = $state([]);
	let unit: string = $derived.by(() => {
		if (!selectedSolution || !selectedCarrier) return '';
		const entry = units.find((entry) => entry.carrier === selectedCarrier);
		return entry?.units || entry?.[0] || '';
	});

	let carriers: string[] = $derived.by(() =>
		removeDuplicates(Object.values(selectedSolution?.detail.reference_carrier || {})).sort()
	);

	// ======================================
	// Effects and functions
	// ======================================

	onValueChange(
		() => (selectedSolution?.solution_name ?? '') + (selectedSolution?.scenario_name ?? ''),
		refreshData
	);

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

		// Fetch data in parallel
		const { unit: unitResponse, ...rest } = await fetchProductionData(
			selectedSolution,
			selectedCarrier,
			'demand'
		);

		// Process and store data
		productionData = rest;
		units = (unitResponse?.data || []) as typeof units;

		fetching = false;
	}

	// ======================================
	// Process data
	// ======================================

	let [pieData, minTotal, maxTotal]: [MapPlotData | null, number, number] = $derived(
		computePieData(
			productionData,
			years,
			selectedSolution,
			selectedCarrier,
			selectedEnergyType,
			selectedYear
		)
	);

	let [lineData, minEdge, maxEdge]: [MapPlotData | null, number, number] = $derived(
		computeLineData(productionData, years, selectedSolution, selectedYear)
	);
</script>

<DiagramPage
	parentTitle="The Map"
	pageTitle="Production"
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
					urlParam="carrier"
					unsetIfInvalid
				></Dropdown>
				{#if selectedCarrier !== null}
					<Dropdown
						options={energyTypes}
						bind:value={selectedEnergyType}
						label="Energy Type"
						disabled={fetching || solutionLoading}
						urlParam="energyType"
					></Dropdown>
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
					<Dropdown bind:value={selectedMap} options={availableMaps} label="Map"></Dropdown>
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
