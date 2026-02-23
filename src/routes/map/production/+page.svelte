<script lang="ts">
	import { untrack } from 'svelte';

	import type { ActivatedSolution } from '$lib/types';
	import { availableMaps } from '$lib/constants';
	import { getTransportEdges, removeDuplicates, typedEntries } from '$lib/utils';

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
	import Entries, { type FilterCriteria } from '@/lib/entries';
	import { fetchProductionData, variables, type ProductionComponent } from '@/lib/productionData';

	let plot = $state<MapPlot>();

	let productionData: Record<ProductionComponent, Entries> | null = $state(null);

	let energyTypes: string[] = ['production', 'consumption'];
	let years: number[] = $state([]);
	const maps: { label: string; value: string }[] = availableMaps;

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedCarrier: string | null = $state(null);
	let selectedEnergyType: string = $state('production');
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

	let carriers: string[] = $derived.by(() => {
		if (!selectedSolution) {
			return [];
		}

		return removeDuplicates(Object.values(selectedSolution.detail.reference_carrier)).sort();
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

	//#endregion

	//#region Data aggregation and transformation for plotting

	let [pieData, minTotal, maxTotal]: [MapPlotData | null, number, number] = $derived.by(() => {
		if (!selectedSolution || !selectedCarrier || !productionData || !selectedEnergyType) {
			return [null, 0, 0];
		}

		const filterCriteria: FilterCriteria = {
			carrier: [selectedCarrier]
		};
		const prodData = productionData;
		const isProduction = selectedEnergyType === 'production';
		const entriesList = typedEntries(variables).map(([id, variable]) => {
			let curData = prodData[isProduction ? variable.positive : variable.negative];
			const label = isProduction ? variable.positiveLabel : variable.negativeLabel;
			const suffix = isProduction ? variable.positiveSuffix : variable.negativeSuffix;

			if (id === 'transport') {
				curData = computeTransportDataPerNode(
					prodData[variable.positive],
					prodData[variable.negative],
					isProduction,
					selectedSolution!.detail.system.set_nodes,
					selectedSolution!.detail.edges
				);
			}

			return curData.filterByCriteria(filterCriteria).mapIndex((index) => {
				if (index.technology === undefined) {
					index.technology = label;
				} else if (suffix) {
					index.technology = index.technology + suffix;
				}
				return index;
			});
		});
		const data = Entries.concatenate(entriesList);

		const index = years.findIndex((year) => year.toString() === selectedYear);
		const mapPlotData = data
			.filterDataByIndex([index])
			.filter(({ data: [d] }) => d > 1e-6)
			.reduce((acc: MapPlotData, { index: { node, technology }, data: [value] }) => {
				acc[node] = acc[node] || [];
				acc[node].push({ technology, value });
				return acc;
			}, {} as MapPlotData);

		const [minTotal, maxTotal] = data.groupBy(['node']).reduce(
			([accMin, accMax], { data: values }) => {
				const total = values.reduce((acc, val) => Math.max(acc, val), 0);
				return [Math.min(accMin, total), Math.max(accMax, total)];
			},
			[Number.MAX_SAFE_INTEGER, 0]
		);

		return [mapPlotData, minTotal, maxTotal];
	});

	function computeTransportDataPerNode(
		positiveData: Entries,
		negativeData: Entries,
		onlyIncoming: boolean,
		nodes: string[],
		edges: Record<string, string>
	): Entries {
		// for each node, find all incoming and outgoing edges and sum the transport data for those edges to get total transport in and out of the node per technology
		const entries = nodes.flatMap((node) => {
			const outgoingEdges = getTransportEdges(edges, [node], false);

			let entries;
			if (onlyIncoming) {
				const incomingEdges = getTransportEdges(edges, [node], true);
				const transportGains = positiveData.filterByCriteria({
					edge: incomingEdges
				});
				const transportLosses = negativeData.filterByCriteria({
					edge: incomingEdges
				});
				entries = transportGains
					.mapEntries((index, data) => {
						const lossData = transportLosses.find(
							(entry) =>
								entry.index.edge === index.edge && entry.index.technology === index.technology
						)?.data;
						if (!lossData || lossData.length !== data.length) {
							return { data, index };
						}
						return { data: data.map((n, i) => n - lossData[i]), index };
					})
					.groupBy(['technology'])
					.mapIndex((index) => ({ ...index, node }));
			} else {
				entries = positiveData.filterByCriteria({
					edge: outgoingEdges
				});
			}

			return entries.groupBy(['technology']).mapIndex((index) => ({ ...index, node }));
		});

		return Entries.concatenate(entries);
	}

	let [lineData, minEdge, maxEdge]: [MapPlotData | null, number, number] = $derived.by(() => {
		if (!selectedSolution || !productionData) {
			return [null, 0, 0];
		}

		const yearIndex = years.findIndex((year) => year.toString() === selectedYear);
		const entries = productionData.flow_transport.reduce((acc, { index, data }) => {
			acc[index.edge] = acc[index.edge] || [];
			acc[index.edge].push({ technology: index.technology, value: data[yearIndex] });
			return acc;
		}, {} as MapPlotData);

		const [minEdge, maxEdge] = productionData.flow_transport.groupBy(['edge'], 'max').reduce(
			([accMin, accMax], { data }) => {
				const total = data.reduce((acc, val) => Math.max(acc, val), 0);
				return [Math.min(accMin, total), Math.max(accMax, total)];
			},
			[Number.MAX_SAFE_INTEGER, 0]
		);

		return [entries, minEdge, maxEdge];
	});

	//#endregion
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
