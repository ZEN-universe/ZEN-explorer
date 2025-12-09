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

	import { get_full_ts as getFullTs } from '$lib/temple';
	import { removeDuplicates } from '$lib/utils';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import type { ActivatedSolution, Entry } from '$lib/types';
	import { nextColor, resetColorState } from '$lib/colors';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';

	// All but one data variable are non-reactive because of their size
	let levelResponse: Entry[] | null = null;
	let chargeResponse: Entry[] | null = null;
	let dischargeResponse: Entry[] | null = null;
	let spillageResponse: Entry[] | null = null;
	let inflowResponse: Entry[] | null = null;
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

	let levelPlot = $state<Chart<any>>();
	let flowPlot = $state<Chart<any>>();

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
	let plotOptions: ChartOptions<'line'> = $derived(getPlotOptions('Storage Level'));
	let plotOptionsFlows: ChartOptions<'line'> = $derived(getPlotOptions('Storage Flow'));

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

	function getPlotOptions(label: string): ChartOptions<'line'> {
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
		return removeDuplicates(levelResponse.map((a) => a.index.node)).sort();
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
		let allTechnologies = removeDuplicates(levelResponse.map((a) => a.index.technology));
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

		const response = await getFullTs(
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

	let levelDatasets: ChartDataset<'bar' | 'line'>[] = [];
	let flowDatasets: ChartDataset<'bar' | 'line'>[] = [];
	let levelDatasetsLength: number = $state(0);
	let flowDatasetsLength: number = $state(0);
	let numberOfTimeSteps: number = $state(0);

	function computeLevelDatasets() {
		if (
			selectedLocations.length == 0 ||
			selectedTechnologies.length == 0 ||
			!levelResponse ||
			!chargeResponse ||
			!dischargeResponse ||
			!inflowResponse ||
			!spillageResponse
		) {
			return [];
		}

		return convertToDataset(
			levelResponse,
			{
				technology: selectedTechnologies,
				node: selectedLocations
			},
			selectedSubdivision ? ['technology'] : [],
			selectedSubdivision
				? undefined
				: () => ({
						label: 'Storage Level',
						borderColor: 'rgb(0, 0, 0)',
						backgroundColor: 'rgba(0, 0, 0, 0.2)'
					})
		);
	}

	function computeFlowDatasets() {
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
			return [];
		}

		return [
			{
				data: chargeResponse,
				labelSuffix: '_charge',
				labelAggregated: 'Flow Storage Charge',
				negate: false,
				color: 'rgb(54, 162, 235)'
			},
			{
				data: dischargeResponse,
				labelSuffix: '_discharge',
				labelAggregated: 'Flow Storage Discharge',
				negate: true,
				color: 'rgb(255, 99, 132)'
			},
			{
				data: inflowResponse,
				labelSuffix: '_inflow',
				labelAggregated: 'Flow Storage Inflow',
				negate: false,
				color: 'rgb(75, 192, 192)'
			},
			{
				data: spillageResponse,
				labelSuffix: '_spillage',
				labelAggregated: 'Flow Storage Spillage',
				negate: true,
				color: 'rgb(255, 99, 132)'
			}
		].flatMap(({ data, labelSuffix, labelAggregated, negate, color }) => {
			return convertToDataset(
				data,
				{
					technology: selectedTechnologies,
					node: selectedLocations
				},
				selectedSubdivision ? ['technology'] : [],
				selectedSubdivision
					? (entry) => ({ label: entry.index.column + labelSuffix })
					: () => ({ label: labelAggregated, borderColor: color, backgroundColor: color }),
				(value) => (negate ? -value : value)
			);
		});
	}

	/**
	 * Update the datasets for the charts.
	 * This function is called when any data or filters change.
	 * We do this because Svelte's reactivity does not work well with large datasets.
	 */
	async function updateDatasets() {
		resetColorState();
		levelDatasets = computeLevelDatasets();
		flowDatasets = computeFlowDatasets();
		levelDatasetsLength = levelDatasets.length;
		flowDatasetsLength = flowDatasets.length;
		numberOfTimeSteps = levelDatasetsLength > 0 ? levelDatasets[0].data.length : 0;

		await tick();

		if (levelPlot) {
			levelPlot.updateChart(levelDatasets);
		}
		if (flowPlot) {
			flowPlot.updateChart(flowDatasets);
		}
	}

	/**
	 * Convert time series data to a chart dataset.
	 *
	 * @param initialEntries The initial time series entries.
	 * @param selectors The selectors to filter the data.
	 * @param groupByAttributes The attributes to group by.
	 * @param buildDatasetBase A function to build the base dataset properties.
	 * @param mapData A function to map the data values.
	 */
	function convertToDataset(
		initialEntries: Entry[],
		selectors: { [key: string]: string[] },
		groupByAttributes: string[] | null,
		buildDatasetBase: (entry: Entry) => Partial<ChartDataset<'line'>> = () => ({}),
		mapData: (value: number, i: number, array: number[]) => number = (value) => value
	): ChartDataset<'bar' | 'line'>[] {
		let entries = initialEntries
			.filter((entry) => {
				// Filter out all entries that do not contain at least one selector
				return Object.entries(selectors).every(([key, values]) => {
					return values.includes(entry.index[key]);
				});
			})
			.map((entry) => {
				// Apply mapping function to each data point
				return {
					index: entry.index,
					data: entry.data.map(mapData)
				};
			});

		if (entries.length === 0) {
			return [];
		}

		if (groupByAttributes) {
			// Group by the specified attributes
			const aggregatedColumns = Array.isArray(groupByAttributes) ? groupByAttributes : [0];
			const aggregatedMap: { [key: string]: number[] } = {};

			entries.forEach((entry) => {
				// Compute label of aggregated entry, initialize it, and compute total for each column
				const label = aggregatedColumns.map((column) => entry.index[column]).join('_');
				if (!aggregatedMap[label]) {
					aggregatedMap[label] = new Array(entry.data.length).fill(0);
				}
				entry.data.forEach((value, i) => {
					aggregatedMap[label][i] += value;
				});
			});

			// Create aggregated entries
			entries = Object.entries(aggregatedMap).map(([column, data]) => {
				return {
					index: { column },
					data: data
				} as Entry;
			});
		}

		// Map entries to datasets
		return entries.map((entry) => {
			const datasetBase = buildDatasetBase(entry);
			const color = datasetBase.borderColor || nextColor();

			return {
				...datasetBase,
				data: entry.data.map((value, i) => ({ x: i, y: value })),
				label: datasetBase.label || entry.index.column,
				type: 'line',
				fill: 'origin',
				stepped: true,
				borderColor: color,
				backgroundColor: datasetBase.backgroundColor || (color as string)
			} as ChartDataset<'bar' | 'line'>;
		});
	}

	//#endregion
</script>

<DiagramPage parentTitle="The Energy Balance" pageTitle="Storage">
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
					></Dropdown>
				{/if}
			</FilterSection>
			{#if selectedSolution !== null && selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<ToggleButton
						bind:value={selectedSubdivision}
						label="Technology Subdivision"
						disabled={fetching || solutionLoading}
					></ToggleButton>
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
		<ChartButtons chart={levelPlot as Chart} downloadable zoomable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if selectedSolution == null}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers with this selection"></ErrorMessage>
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
				plotName={plotName}
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
