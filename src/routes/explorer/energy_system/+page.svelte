<script lang="ts">
	import { untrack } from 'svelte';

	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import SankeyDiagram, { type LegendItem } from '$components/SankeyDiagram.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import Button from '$components/Button.svelte';
	import Spinner from '$components/Spinner.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import Slider from '$components/forms/Slider.svelte';

	import Entries from '$lib/entries';
	import { fetchTotal } from '$lib/temple';
	import type { Row, SankeyNode, PartialSankeyLink, RawSankeyNode } from '$lib/types';
	import { addParametersToPath, QUERY_PARAM_KEYS, useURLParams } from '$lib/queryParams.svelte';
	import { generateSolutionSuffix } from '@/lib/compareSolutions.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import { computeSankeyData, type Component, type Selection } from './processData';

	useURLParams();

	let years: number[] = $state([]);
	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	// Selections
	let selection: Selection = $state({
		solution: null,
		carriers: [],
		nodes: [],
		year: 0,
		transportByNode: false
	});

	let data: Record<Component, Entries | null> = $state.raw({
		conversionInput: null,
		conversionOutput: null,
		storageCharge: null,
		storageDischarge: null,
		import: null,
		export: null,
		demand: null,
		shedDemand: null,
		storageInflow: null,
		storageSpillage: null,
		transport: null,
		transportLoss: null
	});
	let units: Row[] = $state([]);

	let sankeyNodes: Partial<SankeyNode>[] = $state([]);
	let sankeyLinks: PartialSankeyLink[] = $state([]);

	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);

	let legendItems: LegendItem[] = $state([]);

	let diagram = $state<SankeyDiagram>();

	$effect(() => {
		selection.carriers;
		selection.nodes;
		selection.year;
		selection.transportByNode;
		untrack(updateSankeyData);
	});

	function getContextMenuItems(node: RawSankeyNode) {
		if (!selection.solution || !selection.year || !carriers.includes(node.label)) return [];
		return [
			{
				label: `Go to The Transition Pathway - Production (year: ${selection.year}, carrier: ${node.label})`,
				href: addParametersToPath('/explorer/transition/production/', {
					[QUERY_PARAM_KEYS.solutions]: selection.solution.solution_name,
					[QUERY_PARAM_KEYS.scenarios]: selection.solution.scenario_name,
					[QUERY_PARAM_KEYS.carrier]: node.label,
					[QUERY_PARAM_KEYS.activeSolution]: generateSolutionSuffix(selection.solution),
					[QUERY_PARAM_KEYS.activeYear]: selection.year.toString()
				})
			}
		];
	}

	function solutionChanged() {
		fetchData();
	}

	//#region Data fetching and processing

	async function fetchData() {
		if (!selection.solution) {
			return;
		}

		fetching = true;

		let { unit, ...response } = await fetchTotal(
			selection.solution.solution_name,
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
			selection.solution.scenario_name,
			'',
			'demand'
		);

		data = Object.fromEntries(
			[
				['flow_conversion_input', 'conversionInput'],
				['flow_conversion_output', 'conversionOutput'],
				['flow_storage_charge', 'storageCharge'],
				['flow_storage_discharge', 'storageDischarge'],
				['flow_import', 'import'],
				['flow_export', 'export'],
				['demand', 'demand'],
				['shed_demand', 'shedDemand'],
				['flow_storage_inflow', 'storageInflow'],
				['flow_storage_spillage', 'storageSpillage'],
				['flow_transport', 'transport'],
				['flow_transport_loss', 'transportLoss']
			].map(([key, stateKey]) => {
				return [
					stateKey,
					Entries.fromRows(response[key as keyof typeof response]?.data ?? [])
				] as const;
			})
		) as Record<Component, Entries>;
		units = unit?.data || [];

		fetching = false;
		updateSankeyData();
	}

	function updateSankeyData() {
		const { nodes, links, legend } = computeSankeyData(selection, data, units, carriers, years);
		sankeyNodes = nodes;
		sankeyLinks = links;
		legendItems = legend;
	}

	//#endregion
</script>

<DiagramPage pageTitle="The Energy System" subtitle="Sankey diagram of energy flows">
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:years
				bind:selected_solution={selection.solution}
				bind:carriers
				bind:nodes
				bind:loading={solutionLoading}
				solutionSelected={solutionChanged}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if selection.solution != null}
			<FilterSection title="Carrier Selection">
				<MultiSelect
					bind:value={selection.carriers}
					options={carriers}
					label="Carriers"
					urlParam={QUERY_PARAM_KEYS.carriers}
				></MultiSelect>
			</FilterSection>
			<FilterSection title="Data Selection">
				<Slider
					bind:value={selection.year}
					min={years[0]}
					max={years[years.length - 1]}
					step={selection.solution.detail.system.interval_between_years}
					label="Year"
					urlParam={QUERY_PARAM_KEYS.year}
				></Slider>
				<MultiSelect
					bind:value={selection.nodes}
					options={nodes}
					label="Nodes"
					urlParam={QUERY_PARAM_KEYS.nodes}
				></MultiSelect>
				<ToggleButton
					bind:value={selection.transportByNode}
					label="Separate transport flows by node"
					disabled={fetching || solutionLoading}
				>
					{#snippet helpText()}
						Choose whether to display transport flows separately for each node or aggregated into a
						single flow.
					{/snippet}
				</ToggleButton>
			</FilterSection>
		{/if}
	{/snippet}

	{#snippet buttons()}
		{#if diagram}
			<div class="flex h-full items-end justify-end gap-4">
				<Button onclick={diagram?.resetZoom}>
					<i class="bi bi-house me-2"></i>
					<div>Reset zoom</div>
				</Button>
				<Button onclick={diagram?.toggleShowStructureOnly}>
					<i class="bi bi-diagram-3 me-2"></i>
					<div>Show only structure: {diagram?.getShowStructureOnly() ? 'On' : 'Off'}</div>
				</Button>
				<Button onclick={diagram?.downloadSVG}>
					<i class="bi bi-download me-2"></i>
					<div>Download SVG</div>
				</Button>
			</div>
		{/if}
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if !selection.solution}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if selection.carriers.length === 0}
			<WarningMessage message="Please select at least one carrier"></WarningMessage>
		{:else if selection.nodes.length === 0}
			<WarningMessage message="Please select at least one node"></WarningMessage>
		{:else if sankeyNodes.length === 0}
			<ErrorMessage message="No data available for the selected filters"></ErrorMessage>
		{:else}
			<SankeyDiagram
				nodes={sankeyNodes}
				links={sankeyLinks}
				{legendItems}
				{getContextMenuItems}
				bind:this={diagram}
			/>
		{/if}
	{/snippet}
</DiagramPage>
