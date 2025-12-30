<script lang="ts">
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import { onMount, tick, untrack } from 'svelte';

	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Chart from '$components/Chart.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';

	import { fetchFullTs } from '$lib/temple';
	import { removeDuplicates } from '$lib/utils';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { nextColor, resetColorState } from '$lib/colors';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import Entries from '$lib/entries';

	// All but one data variable are non-reactive because of their size
	let levelResponse: Entries | null = null;
	let chargeResponse: Entries | null = null;
	let dischargeResponse: Entries | null = null;
	let spillageResponse: Entries | null = null;
	let inflowResponse: Entries | null = null;
	let responseUpdateTrigger: number = $state(0);
	let units: { [carrier: string]: string } = $state({});

	let years: number[] = $state([]);
	const windowSizes: string[] = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedCarrier: string | null = $state(null);
	let selectedYear: string = $state('');
	let selectedWindowSize: string = $state('Hourly');
	let selectedSubdivision: boolean = $state(true);
	let selectedTechnologies: string[] = $state([]);
	let selectedLocations: string[] = $state([]);

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let levelPlot = $state<Chart>();
	let flowPlot = $state<Chart>();

	let unit: string = $derived.by(() => (technologies.length > 0 ? units[technologies[0]] : ''));

	//#region Plot configuration

	let plotName: string = $derived.by(() => {
		if (!selectedSolution || !selectedSolution.solution_name) {
			return '';
		}
		let solutionNames = selectedSolution.solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selectedSolution.scenario_name,
			'storage_level',
			selectedCarrier
		].join('_');
	});
	let plotNameFlows: string = $derived(plotName + '_flows');
	let plotOptions: ChartOptions = $derived(getPlotOptions('Storage Level'));
	let plotOptionsFlows: ChartOptions = $derived(getPlotOptions('Storage Flow'));

	// Zoom level for both plots
	let zoomLevel: [number, number] | null = $state(null);

	// Time steps per year (for x-axis scaling)
	let timeStepsPerYear: number = $state(0);
	$effect(() => {
		if (selectedSolution?.detail?.system.unaggregated_time_steps_per_year !== undefined) {
			timeStepsPerYear = selectedSolution.detail.system.unaggregated_time_steps_per_year;
		}
	});

	// Reset zoom when timeStepsPerYear changes
	$effect(() => {
		timeStepsPerYear;
		untrack(() => {
			zoomLevel = null;
		});
	});

	function getPlotOptions(label: string): ChartOptions {
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
					max: (selectedSolution?.detail?.system.unaggregated_time_steps_per_year || 0) - 1
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

	//#region Options for filters

	let locations: string[] = $derived.by(() => {
		responseUpdateTrigger;
		if (!levelResponse) {
			return [];
		}
		return removeDuplicates(levelResponse.entries.map((a) => a.index.node)).sort();
	});

	let carriers: string[] = $derived.by(() => {
		if (!selectedSolution) {
			return [];
		}

		return removeDuplicates(Object.values(selectedSolution.detail.reference_carrier)).sort();
	});

	let technologies: string[] = $derived.by(() => {
		responseUpdateTrigger;
		if (!levelResponse || !selectedSolution || carriers.length === 0) {
			return [];
		}
		let allTechnologies = removeDuplicates(levelResponse.entries.map((a) => a.index.technology));
		return allTechnologies.filter(
			(technology) => selectedSolution!.detail.reference_carrier[technology] == selectedCarrier
		);
	});

	$effect(() => {
		technologies;
		untrack(() => {
			selectedTechnologies = technologies;
		});
	});

	$effect(() => {
		locations;
		untrack(() => {
			selectedLocations = locations;
		});
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

	$effect(() => {
		years;
		untrack(() => {
			if (years.length > 0 && (!selectedYear || !years.includes(Number(selectedYear)))) {
				selectedYear = years[0].toString();
				updateDatasets();
			}
		});
	});

	$effect(() => {
		// Triggers
		selectedCarrier;
		selectedSubdivision;
		selectedTechnologies;
		selectedLocations;
		untrack(updateDatasets);
	});

	//#endregion

	//#region Synchronize URL Parameters

	// Set URL parameters
	onMount(() => {
		selectedCarrier = getURLParam('car') || selectedCarrier;
		selectedYear = getURLParam('year') || selectedYear;
		selectedWindowSize = getURLParam('window') || selectedWindowSize;
	});

	$effect(() => {
		// Triggers
		selectedYear;
		selectedCarrier;
		selectedWindowSize;

		tick().then(() => {
			updateURLParams({
				year: selectedYear,
				car: selectedCarrier,
				window: selectedWindowSize
			});
		});
	});

	//#endregion

	$effect(() => {
		fetchData();
	});

	//#region Data fetching and processing

	async function fetchData() {
		if (selectedSolution === null || !selectedYear || selectedCarrier === null) {
			return;
		}

		fetching = true;

		let windowSize =
			{
				Daily: 24,
				Weekly: 168,
				Monthly: 720
			}[selectedWindowSize] || 1; // Default to hourly (1 hour)

		const response = await fetchFullTs(
			selectedSolution.solution_name,
			[
				'storage_level',
				'flow_storage_charge',
				'flow_storage_discharge',
				'flow_storage_spillage',
				'flow_storage_inflow'
			],
			selectedSolution.scenario_name,
			'storage_level',
			Number(selectedYear),
			windowSize,
			selectedCarrier
		);

		levelResponse = response.components.storage_level || null;
		chargeResponse = response.components.flow_storage_charge || null;
		dischargeResponse = response.components.flow_storage_discharge || null;
		spillageResponse = response.components.flow_storage_spillage || null;
		inflowResponse = response.components.flow_storage_inflow || null;
		responseUpdateTrigger++;

		if (response.unit?.data) {
			units = Object.fromEntries(response.unit.data.map((u) => [u.technology, u[0] || u.units]));
		}

		fetching = false;
		updateDatasets();
	}

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: numberOfTimeSteps }, (_, i) => i.toString());
	});

	let levelDatasets: ChartDataset[] = [];
	let flowDatasets: ChartDataset[] = [];
	let levelDatasetsLength: number = $state(0);
	let numberOfTimeSteps: number = $state(0);

	function computeDatasets(): [ChartDataset[], ChartDataset[]] {
		if (
			selectedSolution === null ||
			fetching ||
			selectedLocations.length == 0 ||
			selectedTechnologies.length == 0 ||
			!levelResponse ||
			!chargeResponse ||
			!dischargeResponse ||
			!inflowResponse ||
			!spillageResponse
		) {
			return [[], []];
		}

		const components = [
			{
				data: chargeResponse,
				labelSuffix: '_charge',
				labelAggregated: 'Flow Storage Charge',
				negate: false,
				aggregatedColor: 'rgb(54, 162, 235)',
				aggregatedBackgroundColor: undefined
			},
			{
				data: dischargeResponse,
				labelSuffix: '_discharge',
				labelAggregated: 'Flow Storage Discharge',
				negate: true,
				aggregatedColor: 'rgb(255, 99, 132)',
				aggregatedBackgroundColor: undefined
			},
			{
				data: inflowResponse,
				labelSuffix: '_inflow',
				labelAggregated: 'Flow Storage Inflow',
				negate: false,
				aggregatedColor: 'rgb(75, 192, 192)',
				aggregatedBackgroundColor: undefined
			},
			{
				data: spillageResponse,
				labelSuffix: '_spillage',
				labelAggregated: 'Flow Storage Spillage',
				negate: true,
				aggregatedColor: 'rgb(255, 99, 132)',
				aggregatedBackgroundColor: undefined
			}
		];

		return [
			convertToDatasets({
				data: levelResponse,
				labelSuffix: '',
				labelAggregated: 'Storage Level',
				negate: false,
				aggregatedColor: 'rgb(0, 0, 0)',
				aggregatedBackgroundColor: 'rgba(0, 0, 0, 0.2)'
			}),
			components.flatMap(convertToDatasets)
		];
	}

	function convertToDatasets({
		data,
		labelSuffix,
		labelAggregated,
		negate,
		aggregatedColor,
		aggregatedBackgroundColor
	}: {
		data: Entries;
		labelSuffix: string;
		labelAggregated: string;
		negate: boolean;
		aggregatedColor: string;
		aggregatedBackgroundColor?: string;
	}) {
		let entries = data
			.filterByCriteria({
				technology: selectedTechnologies,
				node: selectedLocations
			})
			.groupBy(selectedSubdivision ? ['technology'] : []);

		if (negate) {
			entries = entries.mapData((value) => -value);
		}

		return entries.toArray().map((entry) => {
			const color = selectedSubdivision ? nextColor() : aggregatedColor;

			return {
				data: entry.data.map((value, i) => ({ x: i, y: value })),
				label: selectedSubdivision ? entry.index.technology + labelSuffix : labelAggregated,
				type: 'line',
				fill: 'origin',
				stepped: true,
				borderColor: color,
				backgroundColor:
					selectedSubdivision || !aggregatedBackgroundColor ? color : aggregatedBackgroundColor
			} as ChartDataset<'bar' | 'line'>;
		});
	}

	/**
	 * Update the datasets for the charts.
	 * This function is called when any data or filters change.
	 * We do this because Svelte's reactivity does not work well with large datasets.
	 */
	async function updateDatasets() {
		resetColorState();
		[levelDatasets, flowDatasets] = computeDatasets();
		levelDatasetsLength = levelDatasets.length;
		numberOfTimeSteps = levelDatasetsLength > 0 ? levelDatasets[0].data.length : 0;

		await tick();

		if (levelPlot) {
			levelPlot.updateChart(levelDatasets);
		}
		if (flowPlot) {
			flowPlot.updateChart(flowDatasets);
		}
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
				bind:selected_solution={selectedSolution}
				bind:loading={solutionLoading}
				bind:years
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if selectedSolution !== null}
			<FilterSection title="Variable Selection">
				<Dropdown
					options={carriers}
					bind:value={selectedCarrier}
					label="Carrier"
					disabled={fetching || solutionLoading}
				></Dropdown>
				{#if selectedCarrier !== null}
					<Dropdown
						options={years.map((year) => year.toString())}
						bind:value={selectedYear}
						label="Year"
						disabled={fetching || solutionLoading}
					></Dropdown>
					<Dropdown
						options={windowSizes}
						bind:value={selectedWindowSize}
						label="Smoothing Window Size"
						disabled={fetching || solutionLoading}
					>
						{#snippet helpText()}
							Visualize the rolling average of hourly values over a longer time period.
						{/snippet}
					</Dropdown>
				{/if}
			</FilterSection>
			{#if selectedSolution !== null && selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<ToggleButton
						bind:value={selectedSubdivision}
						label="Technology Subdivision"
						disabled={fetching || solutionLoading}
					>
						{#snippet helpText()}
							Aggregate or disaggregate all the storage technologies.
						{/snippet}
					</ToggleButton>
					<MultiSelect
						options={technologies}
						bind:value={selectedTechnologies}
						label="Technologies"
						disabled={fetching || solutionLoading}
					></MultiSelect>
					<MultiSelect
						options={locations}
						bind:value={selectedLocations}
						label="Nodes"
						disabled={fetching || solutionLoading}
					></MultiSelect>
				</FilterSection>
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[levelPlot as Chart, flowPlot as Chart]} downloadable zoomable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if selectedSolution == null}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers with this selection"></ErrorMessage>
		{:else if selectedCarrier == null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if technologies.length == 0}
			<ErrorMessage message="No technologies with this selection"></ErrorMessage>
		{:else if locations.length == 0}
			<ErrorMessage message="No locations with this selection"></ErrorMessage>
		{:else if levelDatasetsLength == 0}
			<ErrorMessage message="No data available for this selection"></ErrorMessage>
		{:else}
			<Chart
				id="level_chart"
				type="line"
				{labels}
				datasets={[]}
				options={plotOptions}
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
				datasets={[]}
				options={plotOptionsFlows}
				pluginOptions={plotPluginOptions}
				plotName={plotNameFlows}
				zoom={true}
				bind:zoomLevel
				bind:this={flowPlot}
			></Chart>
		{/if}
	{/snippet}
</DiagramPage>
