<script lang="ts">
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import { tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Chart from '$components/Chart.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import Radio from '$components/forms/Radio.svelte';

	import { useURLParams } from '$lib/queryParams.svelte';
	import { fetchFullTs } from '$lib/temple';
	import { removeDuplicates } from '$lib/utils';
	import { resetColorState } from '$lib/colors';

	import {
		computeDatasets,
		WINDOW_SIZES,
		type Data,
		type DataComponents,
		type Selection,
		type WindowSize
	} from './processData';

	useURLParams();

	// State variables
	let data: Data | null = null;
	let responseUpdateTrigger: number = $state(0);
	let units: { [carrier: string]: string } = $state({});

	let years: number[] = $state([]);

	let selection: Selection = $state({
		solution: null,
		carrier: null,
		year: null,
		windowSize: 'Hourly',
		subdivision: true,
		technologies: [],
		nodes: []
	});

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let levelPlot = $state<Chart>();
	let flowPlot = $state<Chart>();

	let unit: string = $derived.by(() => (technologies.length > 0 ? units[technologies[0]] : ''));

	//#region Plot configuration

	let plotName: string = $derived.by(() => {
		if (!selection.solution || !selection.solution.solution_name) {
			return '';
		}
		let solutionNames = selection.solution.solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selection.solution.scenario_name,
			'storage_level',
			selection.carrier
		].join('_');
	});
	let plotNameFlows: string = $derived(plotName + '_flows');
	let getPlotOptions: () => ChartOptions = () => constructPlotOptions('Storage Level');
	let getPlotOptionsFlows: () => ChartOptions = () => constructPlotOptions('Storage Flow');

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

	function constructPlotOptions(label: string): ChartOptions {
		return {
			animation: false,
			normalized: true,
			parsing: false,
			elements: {
				point: {
					radius: 0
				},
				line: {
					borderWidth: 1
				}
			},
			maintainAspectRatio: false,
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
					max: (selection.solution?.detail?.system.unaggregated_time_steps_per_year || 0) - 1
				},
				y: {
					stacked: true,
					beginAtZero: true,
					title: {
						display: true,
						text: `${label} [${unit}]`
					}
				}
			},
			interaction: {
				intersect: false,
				mode: 'nearest',
				axis: 'x'
			}
		};
	}

	const plotPluginOptions: ChartOptions['plugins'] = {
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

	//#endregion

	//#region Nodes, carriers, and technologies

	let nodes: string[] = $derived.by(() => {
		responseUpdateTrigger;
		if (!data) {
			return [];
		}
		return removeDuplicates(data.storage_level.entries.map((a) => a.index.node)).sort();
	});

	let carriers: string[] = $derived.by(() => {
		if (!selection.solution) {
			return [];
		}

		const set: Set<string> = new SvelteSet();
		selection.solution.detail.system.set_storage_technologies.forEach((tech) => {
			const carrier = selection.solution!.detail.reference_carrier[tech];
			if (carrier) set.add(carrier);
		});
		return Array.from(set).sort();
	});

	let technologies: string[] = $derived.by(() => {
		responseUpdateTrigger;
		if (!data || !selection.solution || carriers.length === 0) {
			return [];
		}
		let allTechnologies = removeDuplicates(
			data.storage_level.entries.map((a) => a.index.technology)
		);
		return allTechnologies.filter(
			(technology) => selection.solution!.detail.reference_carrier[technology] == selection.carrier
		);
	});

	//#endregion

	//#region Fetch data

	$effect(() => {
		selection.solution;
		selection.year;
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
		if (selection.solution === null || selection.year === null || selection.carrier === null) {
			return;
		}

		fetching = true;

		const components: DataComponents[] = [
			'storage_level',
			'flow_storage_charge',
			'flow_storage_discharge',
			'flow_storage_spillage',
			'flow_storage_inflow'
		];

		const response = await fetchFullTs(
			selection.solution.solution_name,
			components,
			selection.solution.scenario_name,
			'storage_level',
			Number(selection.year),
			WINDOW_SIZE_TO_HOURS_MAP[selection.windowSize],
			selection.carrier
		);

		data = Object.fromEntries(
			components.map((component) => [component, response.components[component]])
		) as Data;
		responseUpdateTrigger++;

		if (response.unit?.data) {
			units = Object.fromEntries(response.unit.data.map((u) => [u.technology, u[0] || u.units]));
		}

		fetching = false;
		updateDatasets();
	}

	//#endregion

	//#region Data processing

	$effect(() => {
		// Triggers
		selection.subdivision;
		selection.technologies;
		selection.nodes;
		tick().then(updateDatasets);
	});

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: numberOfTimeSteps }, (_, i) => i.toString());
	});

	let levelDatasets: ChartDataset[] = [];
	let flowDatasets: ChartDataset[] = [];
	let levelDatasetsLength: number = $state(0);
	let numberOfTimeSteps: number = $state(0);

	/**
	 * Update the datasets for the charts.
	 * This function is called when any data or filters change.
	 * We do this because Svelte's reactivity does not work well with large datasets.
	 */
	async function updateDatasets() {
		resetColorState();
		[levelDatasets, flowDatasets] = computeDatasets(data, selection);
		levelDatasetsLength = levelDatasets.length;
		numberOfTimeSteps = levelDatasetsLength > 0 ? levelDatasets[0].data.length : 0;

		await tick();

		levelPlot?.updateChart();
		flowPlot?.updateChart();
	}

	//#endregion
</script>

<DiagramPage
	parentTitle="The Energy Balance"
	pageTitle="Storage"
	subtitle="Charging and discharging flows and storage levels"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<SolutionFilter
				bind:selectedSolution={selection.solution}
				bind:loading={solutionLoading}
				bind:years
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if selection.solution !== null}
			<FilterSection title="Variable Selection">
				<Dropdown
					options={carriers}
					bind:value={selection.carrier}
					label="Carrier"
					disabled={fetching || solutionLoading}
					urlParam="car"
				></Dropdown>
				{#if selection.carrier !== null}
					<Dropdown
						options={years.map((year) => year.toString())}
						bind:value={selection.year}
						label="Year"
						disabled={fetching || solutionLoading}
						urlParam="year"
					></Dropdown>
				{/if}
				{#if selection.carrier !== null && selection.year !== null}
					<Radio
						options={WINDOW_SIZES}
						bind:value={selection.windowSize}
						label="Smoothing Window Size"
						disabled={fetching || solutionLoading}
						urlParam="window"
					>
						{#snippet helpText()}
							Visualize the rolling average of hourly values over a longer time period.
						{/snippet}
					</Radio>
				{/if}
			</FilterSection>
			{#if selection.solution !== null && selection.carrier !== null && selection.year !== null}
				<FilterSection title="Data Selection">
					<ToggleButton
						bind:value={selection.subdivision}
						label="Technology Subdivision"
						disabled={fetching || solutionLoading}
					>
						{#snippet helpText()}
							Aggregate or disaggregate all the storage technologies.
						{/snippet}
					</ToggleButton>
					<MultiSelect
						options={technologies}
						bind:value={selection.technologies}
						label="Technologies"
						disabled={fetching || solutionLoading}
					></MultiSelect>
					<MultiSelect
						options={nodes}
						bind:value={selection.nodes}
						label="Nodes"
						disabled={fetching || solutionLoading}
					></MultiSelect>
				</FilterSection>
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[levelPlot as Chart, flowPlot as Chart]} downloadable zoomable
		></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if selection.solution == null}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers with this selection"></ErrorMessage>
		{:else if selection.carrier == null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if selection.year == null}
			<WarningMessage message="Please select a year"></WarningMessage>
		{:else if technologies.length == 0}
			<ErrorMessage message="No technologies with this selection"></ErrorMessage>
		{:else if nodes.length == 0}
			<ErrorMessage message="No nodes with this selection"></ErrorMessage>
		{:else if levelDatasetsLength == 0}
			<ErrorMessage message="No data available for this selection"></ErrorMessage>
		{:else}
			<Chart
				id="level_chart"
				type="line"
				{labels}
				getDatasets={() => levelDatasets}
				getOptions={getPlotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
				zoom={true}
				bind:zoomLevel
				bind:this={levelPlot}
			></Chart>
			<Chart
				id="flow_chart"
				type="line"
				{labels}
				getDatasets={() => flowDatasets}
				getOptions={getPlotOptionsFlows}
				pluginOptions={plotPluginOptions}
				plotName={plotNameFlows}
				zoom={true}
				bind:zoomLevel
				bind:this={flowPlot}
			></Chart>
		{/if}
	{/snippet}
</DiagramPage>
