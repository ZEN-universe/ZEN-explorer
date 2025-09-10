<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import Entries from '$lib/entries';
	import { get_component_total } from '$lib/temple';
	import type { ActivatedSolution, Row, SankeyNode, SankeyLink, Entry } from '$lib/types';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';
	import { to_options } from '$lib/utils';

	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import SankeyDiagram from '$components/SankeyDiagram.svelte';
	import SolutionFilter from '$components/SolutionFilter.svelte';
	import { next_color, reset_color_state } from '$lib/colors';

	let years: number[] = $state([]);
	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedCarriers: string[] = $state([]);
	let selectedNodes: string[] = $state([]);
	let selectedYear: string | null = $state(null);

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
	let units: Row[] = $state([]);

	function solutionChanged() {
		fetchData();
	}

	let carriers = $derived.by(() => {
		if (!selectedSolution) return [];
		return selectedSolution.detail.system.set_carriers.slice().sort();
	});
	let nodes = $derived.by(() => {
		if (!selectedSolution) return [];
		return selectedSolution.detail.system.set_nodes.slice().sort();
	});

	$effect(() => {
		if (!years.length) {
			selectedYear = null;
			return;
		}
		selectedYear = years[0].toString();
	});
	$effect(() => {
		selectedCarriers = carriers;
	});
	$effect(() => {
		selectedNodes = nodes;
	});

	$effect(() => {
		selectedYear;
		selectedCarriers;
		selectedNodes;

		tick().then(() => {
			untrack(() => {
				update_url_params({
					year: selectedYear,
					carriers: selectedCarriers.join(',') || null,
					nodes: selectedNodes.join(',') || null
				});
			});
		});
	});

	onMount(() => {
		selectedYear = get_url_param('year');
		selectedCarriers = get_url_param('carriers')?.split(',') || [];
		selectedNodes = get_url_param('nodes')?.split(',') || [];
	});

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
				'flow_storage_spillage'
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

		units = response.unit?.data || [];

		fetching = false;
	}

	function getUnit(carrier: string): string {
		let unitRow = units.find((row) => row['carrier'] === carrier) || {};
		return unitRow[0] || unitRow.units || '';
	}

	let sankeyNodes = $derived.by(() => {
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
			!dataStorageSpillage
		) {
			return [];
		}

		// Stage 1: Define nodes
		const grey = 'rgb(180,180,180)';
		const storageTechs = selectedSolution?.detail.system.set_storage_technologies || [];
		const conversionTechs = selectedSolution?.detail.system.set_conversion_technologies || [];

		function newNode(id: string, label: string, color: string): SankeyNode {
			return {
				id,
				label,
				color,
				linksIn: [],
				linksOut: []
			};
		}

		reset_color_state();

		const carrierNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + '_' + getUnit(carrier), next_color())
		);
		const conversionTechNodes = conversionTechs.map((tech) => newNode(tech, tech, grey));
		const storageTechNodes = storageTechs.map((tech) => newNode(tech, tech, grey));
		const inflowNodes = storageTechs.map((tech) => newNode(tech, tech + '_inflow', grey));
		const spillageNodes = storageTechs.map((tech) => newNode(tech, tech + '_spillage', grey));
		let currentColor = next_color();
		const importNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + '_import', currentColor)
		);
		currentColor = next_color();
		const exportNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + '_export', currentColor)
		);
		currentColor = next_color();
		const shedDemandNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + '_shed_demand', currentColor)
		);
		currentColor = next_color();
		const demandNodes = carriers.map((carrier) =>
			newNode(carrier, carrier + '_demand', currentColor)
		);

		// Stage 2: Define links
		const filterCriteria = { carrier: selectedCarriers, node: selectedNodes };
		const indexOfYear = years.indexOf(Number(selectedYear));

		function addLink(
			sourceNodes: SankeyNode[],
			sourceId: string,
			targetNodes: SankeyNode[],
			targetId: string,
			subtract = 0
		): (entry: Entry) => void {
			return (entry: Entry) => {
				const value = entry.data[indexOfYear] - subtract;
				if (Math.abs(value) < 1e-6) return;

				const sourceNode = sourceNodes.find((node) => node.id === entry.index[sourceId]);
				const targetNode = targetNodes.find((node) => node.id === entry.index[targetId]);
				if (!sourceNode || !targetNode) return;

				const link: SankeyLink = { source: sourceNode, target: targetNode, value };
				sourceNode.linksOut.push(link);
				targetNode.linksIn.push(link);
			};
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
			.forEach(addLink(carrierNodes, 'carrier', storageTechNodes, 'technology'));
		// storage discharge: storage tech -> carrier
		dataStorageDischarge
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach(addLink(storageTechNodes, 'technology', carrierNodes, 'carrier'));
		// storage inflow: inflow -> storage tech
		dataStorageInflow
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
			.forEach(addLink(inflowNodes, 'technology', storageTechNodes, 'technology'));
		// storage spillage: storage tech -> spillage
		dataStorageSpillage
			.filterByCriteria(filterCriteria)
			.groupBy(['technology'])
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

		return [
			...importNodes,
			...carrierNodes,
			...exportNodes,
			...demandNodes,
			...shedDemandNodes,
			...conversionTechNodes,
			...storageTechNodes,
			...inflowNodes,
			...spillageNodes
		].filter((node) => node.linksIn.length > 0 || node.linksOut.length > 0);
	});
</script>

<h1 class="mt-2 mb-4">The Energy System</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:years
			bind:selected_solution={selectedSolution}
			bind:loading={solutionLoading}
			solution_selected={solutionChanged}
			disabled={fetching || solutionLoading}
		/>
	</FilterSection>
	<FilterSection title="Carrier Selection">
		<AllCheckbox label="Carriers" bind:value={selectedCarriers} elements={carriers}></AllCheckbox>
	</FilterSection>
	<FilterSection title="Data Selection">
		<FilterRow label="Year">
			{#snippet content(formId)}
				<Dropdown
					{formId}
					bind:value={selectedYear}
					options={to_options(years.map((year) => year.toString()))}
					disabled={fetching || solutionLoading}
				></Dropdown>
			{/snippet}
		</FilterRow>
		<AllCheckbox label="Nodes" bind:value={selectedNodes} elements={nodes}></AllCheckbox>
	</FilterSection>
</Filters>

<div class="plot my-4">
	{#if solutionLoading || fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if !selectedSolution}
		<div class="text-center">No solution selected</div>
	{:else if sankeyNodes.length === 0}
		<div class="text-center">No data available for the selected filters</div>
	{:else}
		<SankeyDiagram nodes={sankeyNodes} />
	{/if}
</div>
