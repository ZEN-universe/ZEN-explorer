<script lang="ts">
	import { tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';

	import { fetchEnergyBalance, fetchUnit } from '$lib/temple';
	import { getVariableName } from '$lib/variables';
	import { resetColorState } from '$lib/colors';
	import { QUERY_PARAM_KEYS, useURLParams } from '$lib/queryParams.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ContentBox from '$components/ContentBox.svelte';
	import HelpTooltip from '$components/HelpTooltip.svelte';
	import Radio from '$components/forms/Radio.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import type { NodalData } from '$lib/types';

	import {
		computeDatasets,
		computeDualsDatasets,
		WINDOW_SIZES,
		type Selection,
		type WindowSize
	} from './processData';

	useURLParams();

	let data: NodalData | null = null;
	let unitData: Record<string, string>[] | null = $state(null);
	let unitObjectiveData: Record<string, string>[] | null = $state(null);

	let solutionLoading: boolean = $state(false);
	let fetching = $state(false);

	let plot = $state<Chart>();
	let dualsPlot = $state<Chart>();

	let nodes: string[] = $state([]);
	let carriers: string[] = $state([]);
	let years: number[] = $state([]);

	let selection: Selection = $state({
		solution: null,
		node: null,
		carrier: null,
		year: null,
		windowSize: 'Hourly',
		transportByNode: false
	});

	//#region Plot configuration

	let plotName: string = $derived.by(() => {
		if (!selection.solution || !selection.solution.solution_name) {
			return '';
		}
		let solutionNames = selection.solution.solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selection.solution.scenario_name,
			'balance',
			selection.carrier,
			selection.node,
			selection.year
		].join('_');
	});
	let dualsPlotName: string = $derived.by(() => {
		return plotName + '_duals';
	});
	let unit = $derived.by(() => {
		if (unitData === null) {
			return '';
		}
		let unitEntry = unitData.find((entry) => entry['carrier'] === selection.carrier);
		if (unitEntry) {
			return unitEntry[0] || unitEntry['units'] || '';
		}
		return unitData[0][0] || unitData[0]['units'] || '';
	});
	let dualUnit = $derived.by(() => {
		let unitOfDemandCarrier = unit;
		if (unit.includes('*') || unit.includes('/')) {
			unitOfDemandCarrier = `(${unitOfDemandCarrier})`;
		}
		const unitOfObjective = unitObjectiveData?.[0][0] || unitObjectiveData?.[0]['units'] || '';
		return `${unitOfObjective} / ${unitOfDemandCarrier}`;
	});

	// Zoom level for both plots
	let zoomLevel: [number, number] | null = $state(null);

	// Time steps per year (for x-axis scaling)
	let timeStepsPerYear: number = $state(0);
	$effect(() => {
		if (selection.solution?.detail?.system.unaggregated_time_steps_per_year !== undefined) {
			timeStepsPerYear = selection.solution.detail.system.unaggregated_time_steps_per_year;
		}
	});

	// Reset zoom when timeStepsPerYear changes
	$effect(() => {
		timeStepsPerYear;
		untrack(() => {
			zoomLevel = null;
		});
	});

	let getPlotOptions: () => ChartOptions = () => constructPlotOptions(`Energy [${unit}]`);
	let getDualsPlotOptions: () => ChartOptions = () =>
		constructPlotOptions(`Shadow Price [${dualUnit}]`, 5, false);

	function constructPlotOptions(
		yAxisLabel: string,
		aspectRatio: number = 2,
		yAxisBeginAtZero: boolean = true
	): ChartOptions<'bar' | 'line'> {
		return {
			animation: false,
			normalized: true,
			parsing: false,
			maintainAspectRatio: false,
			borderWidth: 1,
			aspectRatio,
			elements: {
				point: {
					radius: 0
				}
			},
			scales: {
				x: {
					type: 'linear',
					stacked: true,
					title: {
						display: true,
						text: 'Time'
					},
					ticks: {
						maxRotation: 0,
						autoSkip: true,
						callback: (value) => Number(value).toFixed(0)
					},
					min: 0,
					max: timeStepsPerYear - 1
				},
				y: {
					stacked: true,
					beginAtZero: yAxisBeginAtZero,
					title: {
						display: true,
						text: yAxisLabel
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x'
			}
		} as ChartOptions<'bar' | 'line'>;
	}

	const plotPluginOptions: ChartOptions['plugins'] = $derived(getPluginOptions(unit));
	const dualsPlotPluginOptions: ChartOptions['plugins'] = $derived(getPluginOptions(dualUnit));

	function getPluginOptions(unit: string): ChartOptions['plugins'] {
		return {
			zoom: {
				pan: {
					enabled: true,
					modifierKey: 'ctrl',
					mode: 'x'
				},
				zoom: {
					drag: {
						enabled: true
					},
					wheel: {
						enabled: true
					},
					mode: 'x'
				},
				limits: {
					x: { minRange: 10, min: 'original', max: 'original' }
				}
			},
			tooltip: {
				callbacks: {
					label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
						`${item.dataset.label}: ${item.formattedValue} ${unit}`
				}
			}
		};
	}

	//#endregion

	//#region Fetch data

	$effect(() => {
		selection.solution;
		selection.year;
		selection.node;
		selection.carrier;
		selection.windowSize;
		tick().then(fetchData);
	});

	const WINDOW_SIZE_TO_HOURS_MAP: Record<WindowSize, number> = {
		Hourly: 1,
		Daily: 24,
		Weekly: 168,
		Monthly: 720
	};

	async function fetchData() {
		if (!selection.node || !selection.carrier || !selection.year || !selection.solution) {
			return;
		}

		fetching = true;

		// Fetch the energy balance data
		const responses = await Promise.all([
			fetchEnergyBalance(
				selection.solution.solution_name,
				selection.node,
				selection.carrier,
				selection.solution.scenario_name,
				Number(selection.year),
				WINDOW_SIZE_TO_HOURS_MAP[selection.windowSize]
			),
			fetchUnit(
				selection.solution.solution_name,
				getVariableName('flow_export', selection.solution.version)
			),
			fetchUnit(
				selection.solution.solution_name,
				selection.solution.objective === 'total_cost'
					? getVariableName('net_present_cost', selection.solution.version)
					: getVariableName('carbon_emissions_cumulative', selection.solution.version)
			)
		]);

		data = responses[0];
		unitData = responses[1].data;
		unitObjectiveData = responses[2].data;

		fetching = false;
		updateDatasets();
	}

	//#endregion

	//#region Compute datasets

	$effect(() => {
		selection.transportByNode;
		untrack(updateDatasets);
	});

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: numberOfTimeSteps }, (_, i) => i.toString());
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = [];
	let dualsDatasets: ChartDataset<'bar' | 'line'>[] = [];
	let datasetsLength: number = $state(0);
	let dualsDatasetsLength: number = $state(0);
	let numberOfTimeSteps: number = $state(0);

	async function updateDatasets() {
		resetColorState();
		datasets = computeDatasets(data, selection);
		datasetsLength = datasets.length;
		numberOfTimeSteps = datasetsLength > 0 ? datasets[0].data.length : 0;
		dualsDatasets = computeDualsDatasets(data, selection);
		dualsDatasetsLength = dualsDatasets.length;

		await tick();

		if (plot) {
			plot.updateChart();
		}
		if (dualsPlot) {
			dualsPlot.updateChart();
		}
	}

	//#endregion
</script>

<DiagramPage
	parentTitle="The Energy Balance"
	pageTitle="Nodal"
	subtitle="Hourly production and consumption of a carrier"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:selectedSolution={selection.solution}
				bind:carriers
				bind:nodes
				bind:years
				bind:loading={solutionLoading}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && selection.solution !== null}
			<FilterSection title="Data Selection">
				<Dropdown
					options={carriers}
					bind:value={selection.carrier}
					label="Carrier"
					disabled={fetching || solutionLoading}
					urlParam={QUERY_PARAM_KEYS.carrier}
					unsetIfInvalid
					default={null}
				></Dropdown>
				{#if selection.carrier !== null}
					<Dropdown
						options={years.map((year) => year.toString())}
						bind:value={selection.year}
						label="Year"
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.year}
						unsetIfInvalid
						default={null}
					></Dropdown>
				{/if}
				{#if selection.carrier !== null && selection.year !== null}
					<Dropdown
						options={nodes}
						bind:value={selection.node}
						label="Node"
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.node}
						unsetIfInvalid
						default={null}
					></Dropdown>
				{/if}
				{#if selection.carrier !== null && selection.year !== null && selection.node !== null}
					<Radio
						options={WINDOW_SIZES}
						bind:value={selection.windowSize}
						label="Smoothing Window Size"
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.smoothing_window_size}
						default="Hourly"
						unsetIfInvalid
					>
						{#snippet helpText()}
							Visualize the rolling average of hourly values over a longer time period
						{/snippet}
					</Radio>
				{/if}
			</FilterSection>
			{#if selection.carrier != null && selection.year != null && selection.node != null}
				<FilterSection title="Display Options">
					<ToggleButton
						bind:value={selection.transportByNode}
						label="Separate transport flows by node"
						disabled={fetching || solutionLoading}
					>
						{#snippet helpText()}
							Choose whether to display transport flows separately for each node or aggregated into
							a single flow.
						{/snippet}
					</ToggleButton>
				</FilterSection>
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[plot as Chart, dualsPlot as Chart]} downloadable zoomable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers available for the selection solution"></ErrorMessage>
		{:else if selection.carrier == null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if selection.year == null}
			<WarningMessage message="Please select a year"></WarningMessage>
		{:else if selection.node == null}
			<WarningMessage message="Please select a node"></WarningMessage>
		{:else if datasetsLength == 0 || selection.solution == null}
			<ErrorMessage message="No data with this selection"></ErrorMessage>
		{:else}
			<Chart
				type={numberOfTimeSteps == 1 ? 'bar' : 'line'}
				{labels}
				getDatasets={() => datasets}
				getOptions={getPlotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
				zoom={true}
				bind:zoomLevel
				bind:this={plot}
			></Chart>
			{#if dualsDatasetsLength > 0}
				<ContentBox>
					<h2 class="text-lg font-bold">
						<span class="me-2">Shadow Prices</span>
						<HelpTooltip>
							Shadow price of the nodal energy balance of carrier {selection.carrier}. Indicates the
							change in total cost for the next marginal unit of demand.
						</HelpTooltip>
					</h2>
					<Chart
						id="chart-duals"
						type={numberOfTimeSteps == 1 ? 'bar' : 'line'}
						{labels}
						getDatasets={() => dualsDatasets}
						getOptions={getDualsPlotOptions}
						pluginOptions={dualsPlotPluginOptions}
						plotName={dualsPlotName}
						zoom={true}
						initialHeight={300}
						generateLabels={() => []}
						bind:zoomLevel
						bind:this={dualsPlot}
						boxed={false}
					></Chart>
				</ContentBox>
			{:else}
				<ContentBox>
					<div class="text-muted my-2 text-center text-xl">No shadow prices available.</div>
				</ContentBox>
			{/if}
		{/if}
	{/snippet}
</DiagramPage>
