<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import Entries from '$lib/entries';
	import { get_component_total } from '$lib/temple';
	import type { ActivatedSolution, Row, Entry, SankeyNode, PartialSankeyLink } from '$lib/types';
	import { getURLParam, getURLParamAsIntArray, updateURLParams } from '$lib/queryParams.svelte';
	import { nextColor, resetColorState } from '$lib/colors';
	import { getTransportEdges, toOptions } from '$lib/utils';
	import { updateSelectionOnStateChanges } from '$lib/filterSelection.svelte';

	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import SankeyDiagram, { type LegendItem } from '$components/SankeyDiagram.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';

	let years: number[] = $state([]);
	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	// Selections
	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedCarriers: string[] = $state([]);
	let selectedNodes: string[] = $state([]);
	let selectedYear: string | null = $state(null);

	// Temporary objects to store URL parameters and previous selection.
	let urlCarriers: number[] | null | null = null;
	let urlNodes: number[] | null = null;
	let previousCarriers: string = '';
	let previousNodes: string = '';
	let previousYear: string = '';

	let dataConversionInput: Entries | null = $state.raw(null);
	let dataConversionOutput: Entries | null = $state(null);
	let dataStorageCharge: Entries | null = $state(null);
	let dataStorageDischarge: Entries | null = $state(null);
	let dataImport: Entries | null = $state(null);
	let dataExport: Entries | null = $state(null);
	let dataDemand: Entries | null = $state(null);
	let dataShedDemand: Entries | null = $state(null);
	let dataStorageInflow: Entries | null = $state(null);
	let dataStorageSpillage: Entries | null = $state(null);
	let dataTransport: Entries | null = $state(null);
	let dataTransportLoss: Entries | null = $state(null);
	let units: Row[] = $state([]);

	let sankeyNodes: Partial<SankeyNode>[] = $state([]);
	let sankeyLinks: PartialSankeyLink[] = $state([]);

	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);

	let legendItems: LegendItem[] = $state([]);

	let diagram = $state<SankeyDiagram>();

	//#region Effects and functions

	$effect(() => {
		if (!years.length) {
			selectedYear = null;
			return;
		}
		if (previousYear && years.includes(Number(previousYear))) {
			selectedYear = previousYear;
		} else {
			selectedYear = years[0].toString();
		}
	});

	$effect(() => {
		if (!selectedYear) return;
		previousYear = selectedYear;
	});

	updateSelectionOnStateChanges(
		() => carriers,
		() => !!selectedSolution,
		() => previousCarriers,
		() => urlCarriers,
		(value) => (selectedCarriers = value),
		(value) => (previousCarriers = value),
		(value) => (urlCarriers = value)
	);
	updateSelectionOnStateChanges(
		() => nodes,
		() => !!selectedSolution,
		() => previousNodes,
		() => urlNodes,
		(value) => (selectedNodes = value),
		(value) => (previousNodes = value),
		(value) => (urlNodes = value)
	);

	$effect(() => {
		selectedCarriers;
		selectedNodes;
		selectedYear;
		untrack(() => {
			computeSankeyData();
		});
	});

	$effect(() => {
		selectedYear;
		selectedCarriers;
		selectedNodes;

		tick().then(() => {
			untrack(() => {
				updateURLParams({
					year: selectedYear,
					car: selectedCarriers.map((c) => carriers.indexOf(c)).join('~') || null,
					nodes: selectedNodes.map((n) => nodes.indexOf(n)).join('~') || null
				});
			});
		});
	});

	onMount(() => {
		selectedYear = getURLParam('year');
		urlCarriers = getURLParamAsIntArray('car');
		urlNodes = getURLParamAsIntArray('nodes');
	});

	//#endregion

	function solutionChanged() {
		fetchData();
	}

	//#region Data fetching and processing

	async function fetchData() {
		if (!selectedSolution) {
			return;
		}

		fetching = true;

		let response = await get_component_total(
			selectedSolution.solution_name,
			[
				'flow_conversion_input',
				'flow_conversion_output',
				'flow_storage_charge',
				'flow_storage_discharge',
				'flow_import',
				'flow_export',
				'demand',
				'shed_demand',
				'flow_storage_inflow',
				'flow_storage_spillage',
				'flow_transport',
				'flow_transport_loss'
			],
			selectedSolution.scenario_name,
			'demand'
		);

		dataConversionInput = Entries.fromRows(response['flow_conversion_input']?.data ?? []);
		dataConversionOutput = Entries.fromRows(response['flow_conversion_output']?.data ?? []);
		dataStorageCharge = Entries.fromRows(response['flow_storage_charge']?.data ?? []);
		dataStorageDischarge = Entries.fromRows(response['flow_storage_discharge']?.data ?? []);
		dataImport = Entries.fromRows(response['flow_import']?.data ?? []);
		dataExport = Entries.fromRows(response['flow_export']?.data ?? []);
		dataDemand = Entries.fromRows(response['demand']?.data ?? []);
		dataShedDemand = Entries.fromRows(response['shed_demand']?.data ?? []);
		dataStorageInflow = Entries.fromRows(response['flow_storage_inflow']?.data ?? []);
		dataStorageSpillage = Entries.fromRows(response['flow_storage_spillage']?.data ?? []);
		dataTransport = Entries.fromRows(response['flow_transport']?.data ?? []);
		dataTransportLoss = Entries.fromRows(response['flow_transport_loss']?.data ?? []);

		units = response.unit?.data || [];

		fetching = false;

		computeSankeyData();
	}

	function getUnit(carrier: string): string {
		let unitRow = units.find((row) => row['carrier'] === carrier) || {};
		return unitRow[0] || unitRow.units || '';
	}

	function getReferenceCarrier(technology: string): string {
		if (!selectedSolution) return '';
		return selectedSolution.detail.reference_carrier[technology] || '';
	}

	function getTechnologiesRelatedToCarriers(selectedCarriers: string[]): string[] {
		if (!selectedSolution) return [];
		return selectedSolution.detail.system.set_technologies.filter((technology) => {
			const inputCarriers = selectedSolution?.detail.carriers_input[technology] || [];
			const outputCarriers = selectedSolution?.detail.carriers_output[technology] || [];
			const referenceCarrier = selectedSolution?.detail.reference_carrier[technology];
			return (
				[...inputCarriers, ...outputCarriers].some((c) => selectedCarriers.includes(c)) ||
				(referenceCarrier && selectedCarriers.includes(referenceCarrier))
			);
		});
	}

	function computeSankeyData() {
		if (
			!selectedSolution ||
			!dataConversionInput ||
			!dataConversionOutput ||
			!dataStorageCharge ||
			!dataStorageDischarge ||
			!dataImport ||
			!dataExport ||
			!dataDemand ||
			!dataShedDemand ||
			!dataStorageInflow ||
			!dataStorageSpillage ||
			!dataTransport ||
			!dataTransportLoss
		) {
			return [];
		}

		// Stage 1: Define nodes
		const grey = 'rgb(180,180,180)';
		const storageTechs = selectedSolution?.detail.system.set_storage_technologies || [];
		const conversionTechs = selectedSolution?.detail.system.set_conversion_technologies || [];
		const transportTechs = selectedSolution?.detail.system.set_transport_technologies || [];

		function newNode(
			id: string,
			label: string,
			color: string,
			unit: string,
			unitSuffix: boolean = false,
			stickTo: 'left' | 'right' | null = null,
			showTotal: boolean = true,
			distinctRow: boolean = false
		): Partial<SankeyNode> {
			return {
				id,
				label,
				color,
				unit,
				unitSuffix,
				stickTo,
				showTotal,
				distinctRow
			};
		}

		resetColorState();
		const colors: LegendItem[] = [];

		const carrierNodes = carriers.map((carrier) => {
			const color = nextColor(carrier);
			colors.push({ color, carrier });
			return newNode(carrier, carrier, color, getUnit(carrier), true, null, true, true);
		});
		const conversionTechNodes = conversionTechs.map((tech) =>
			newNode(tech, tech, grey, getUnit(getReferenceCarrier(tech)), false, null, false)
		);
		const storageTechNodes = storageTechs.map((tech) =>
			newNode(tech, tech, grey, getUnit(getReferenceCarrier(tech)), false, null, false)
		);
		const inflowNodes = storageTechs.map((tech) =>
			newNode(tech, tech + '_inflow', grey, getUnit(getReferenceCarrier(tech)))
		);
		const spillageNodes = storageTechs.map((tech) =>
			newNode(
				tech,
				tech + '_spillage',
				grey,
				getUnit(getReferenceCarrier(tech)),
				false,
				null,
				false
			)
		);
		let currentColor = nextColor();
		const importNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + ' import', currentColor, getUnit(carrier), true, 'left')
		);
		currentColor = nextColor();
		const exportNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + ' export', currentColor, getUnit(carrier), true, 'right')
		);
		currentColor = nextColor();
		const shedDemandNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + ' shed demand', currentColor, getUnit(carrier))
		);
		currentColor = nextColor();
		const demandNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + ' demand', currentColor, getUnit(carrier), true, 'right')
		);
		currentColor = nextColor();
		const transportInNodes = transportTechs.map((tech) =>
			newNode(
				tech,
				tech + ' transport in',
				currentColor,
				getUnit(getReferenceCarrier(tech)),
				false,
				null,
				false
			)
		);
		const transportOutNodes = transportTechs.map((tech) =>
			newNode(
				tech,
				tech + ' transport out',
				currentColor,
				getUnit(getReferenceCarrier(tech)),
				false,
				null,
				false
			)
		);

		// Stage 2: Define links
		const filterCriteria = {
			carrier: selectedCarriers,
			node: selectedNodes,
			technology: getTechnologiesRelatedToCarriers(selectedCarriers)
		};
		const indexOfYear = years.indexOf(Number(selectedYear));
		if (indexOfYear === -1) return;
		const links: PartialSankeyLink[] = [];

		function addLink(
			sourceNodes: Partial<SankeyNode>[],
			sourceId: string,
			targetNodes: Partial<SankeyNode>[],
			targetId: string,
			subtract = 0
		): (entry: Entry) => void {
			return (entry: Entry) => {
				let value = entry.data[indexOfYear] - subtract;
				if (Math.abs(value) < 5e-4) {
					value = 0;
				}

				const sourceNode = sourceNodes.find((node) => node.id === entry.index[sourceId]);
				const targetNode = targetNodes.find((node) => node.id === entry.index[targetId]);
				if (!sourceNode || !targetNode) {
					console.warn(
						'Missing source or target node',
						{ sourceNode, targetNode },
						{ sourceId, targetId }
					);
					return;
				}

				let color = grey;
				const carrierNode = carrierNodes.find((node) => node.id === entry.index.carrier);
				if (carrierNode) {
					color = carrierNode.color || grey;
				}

				links.push({
					source: sourceNode,
					target: targetNode,
					value,
					color,
					unit: getUnit(entry.index.carrier)
				});
			};
		}

		function addCarrierToEntry(entry: Entry): void {
			const referenceCarrier = getReferenceCarrier(entry.index.technology);
			if (!referenceCarrier) return;
			entry.index.carrier = referenceCarrier;
		}

		// conversion input: carrier -> conversion tech
		dataConversionInput
			.filterByCriteria(filterCriteria)
			.groupBy(['technology', 'carrier'])
			.forEach(addLink(carrierNodes, 'carrier', conversionTechNodes, 'technology'));
		// conversion output: conversion tech -> carrier
		dataConversionOutput
			.filterByCriteria(filterCriteria)
			.groupBy(['technology', 'carrier'])
			.forEach(addLink(conversionTechNodes, 'technology', carrierNodes, 'carrier'));
		// storage charge: carrier -> storage tech
		dataStorageCharge
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach((entry) => {
				const referenceCarrier = getReferenceCarrier(entry.index.technology);
				if (!referenceCarrier) return;
				entry.index.carrier = referenceCarrier;
			})
			.forEach(addLink(carrierNodes, 'carrier', storageTechNodes, 'technology'));
		// storage discharge: storage tech -> carrier
		dataStorageDischarge
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach(addCarrierToEntry)
			.forEach(addLink(storageTechNodes, 'technology', carrierNodes, 'carrier'));
		// storage inflow: inflow -> storage tech
		dataStorageInflow
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach(addCarrierToEntry)
			.forEach(addLink(inflowNodes, 'technology', storageTechNodes, 'technology'));
		// storage spillage: storage tech -> spillage
		dataStorageSpillage
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach(addCarrierToEntry)
			.forEach(addLink(storageTechNodes, 'technology', spillageNodes, 'technology'));
		// import: import -> carrier
		dataImport
			.filterByCriteria(filterCriteria)
			.groupBy(['carrier'])
			.forEach(addLink(importNodes, 'carrier', carrierNodes, 'carrier'));
		// export: carrier -> export
		dataExport
			.filterByCriteria(filterCriteria)
			.groupBy(['carrier'])
			.forEach(addLink(carrierNodes, 'carrier', exportNodes, 'carrier'));
		// shed demand: shed demand -> demand
		const aggregatedShedDemand = dataShedDemand
			.filterByCriteria(filterCriteria)
			.groupBy(['carrier']);
		aggregatedShedDemand.forEach(addLink(shedDemandNodes, 'carrier', demandNodes, 'carrier'));
		// demand minus shed demand: carrier -> demand
		dataDemand
			.filterByCriteria(filterCriteria)
			.groupBy(['carrier'])
			.forEach((entry) => {
				const shedEntry = aggregatedShedDemand.find((e) => e.index.carrier === entry.index.carrier);
				const shedValue = shedEntry ? shedEntry.data[indexOfYear] : 0;
				addLink(carrierNodes, 'carrier', demandNodes, 'carrier', shedValue)(entry);
			});
		// transport in = transport - transport loss: transport in -> carrier:
		const transportInEdges = getTransportEdges(selectedSolution.detail.edges, selectedNodes, true);
		const aggregatedTransportIn = dataTransportLoss
			.filterByCriteria({
				...filterCriteria,
				edge: transportInEdges
			})
			.groupBy(['technology']);
		dataTransport
			.filterByCriteria({
				...filterCriteria,
				edge: transportInEdges
			})
			.groupBy(['technology'])
			.forEach(addCarrierToEntry)
			.forEach((entry) => {
				const lossEntry = aggregatedTransportIn.find(
					(e) => e.index.technology === entry.index.technology
				);
				const lossValue = lossEntry ? lossEntry.data[indexOfYear] : 0;
				addLink(transportInNodes, 'technology', carrierNodes, 'carrier', lossValue)(entry);
			});
		// transport out = transport: carrier -> transport out
		dataTransport
			.filterByCriteria({
				...filterCriteria,
				edge: getTransportEdges(selectedSolution.detail.edges, selectedNodes, false)
			})
			.groupBy(['technology'])
			.forEach(addCarrierToEntry)
			.forEach(addLink(carrierNodes, 'carrier', transportOutNodes, 'technology'));

		sankeyNodes = [
			...carrierNodes,
			...conversionTechNodes,
			...storageTechNodes,
			...inflowNodes,
			...spillageNodes,
			...importNodes,
			...exportNodes,
			...shedDemandNodes,
			...demandNodes,
			...transportInNodes,
			...transportOutNodes
		];
		sankeyLinks = links;
		legendItems = colors;
	}

	//#endregion
</script>

<DiagramPage parentTitle="The Energy System" pageTitle="Sankey">
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:years
				bind:selected_solution={selectedSolution}
				bind:carriers
				bind:nodes
				bind:loading={solutionLoading}
				solutionSelected={solutionChanged}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		<FilterSection title="Carrier Selection">
			<MultiSelect bind:value={selectedCarriers} options={carriers} label="Carriers"></MultiSelect>
		</FilterSection>
		<FilterSection title="Data Selection">
			<Dropdown
				bind:value={selectedYear}
				options={toOptions(years.map((year) => year.toString()))}
				label="Year"
				disabled={fetching || solutionLoading}
			></Dropdown>
			<MultiSelect bind:value={selectedNodes} options={nodes} label="Nodes"></MultiSelect>
		</FilterSection>
	{/snippet}

	{#snippet buttons()}
		<div class="flex justify-end items-end h-full gap-4">
			<Button onclick={diagram?.resetZoom}>
				<i class="bi bi-house me-2"></i>
				<div>Reset zoom</div>
			</Button>
			<Button onclick={diagram?.toggleShowStructureOnly}>
				<i class="bi bi-diagram-3 me-2"></i>
				<div>Show only structure: {diagram?.getShowStructureOnly() ? 'On' : 'Off'}</div>
			</Button>
		</div>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if !selectedSolution}
			<div class="text-center">No solution selected</div>
		{:else if selectedCarriers.length === 0}
			<div class="text-center">No carriers selected</div>
		{:else if selectedNodes.length === 0}
			<div class="text-center">No nodes selected</div>
		{:else if sankeyNodes.length === 0}
			<div class="text-center">No data available for the selected filters</div>
		{:else}
			<SankeyDiagram nodes={sankeyNodes} links={sankeyLinks} {legendItems} bind:this={diagram} />
		{/if}
	{/snippet}
</DiagramPage>
