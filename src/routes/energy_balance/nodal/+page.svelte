<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';

	import { fetchEnergyBalance, fetchUnit } from '$lib/temple';
	import { getVariableName } from '$lib/variables';
	import { nextColor, resetColorState } from '$lib/colors';
	import type { ActivatedSolution, EnergyBalanceDataframes } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import type Entries from '$lib/entries';
	import ContentBox from '$components/ContentBox.svelte';
	import HelpTooltip from '$components/HelpTooltip.svelte';

	let energyBalanceData: EnergyBalanceDataframes | null = null;
	let unitData: Record<string, string>[] | null = $state(null);
	let unitObjectiveData: Record<string, string>[] | null = $state(null);

	let solutionLoading: boolean = $state(false);
	let fetching = $state(false);

	let plot = $state<Chart>();
	let dualsPlot = $state<Chart>();

	let nodes: string[] = $state([]);
	let carriers: string[] = $state([]);
	let years: number[] = $state([]);
	const windowSizes = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedNode: string | null = $state(null);
	let selectedCarrier: string | null = $state(null);
	let selectedYear: string | null = $state(null);
	let selectedWindowSize = $state('Hourly');

	//#region Plot configuration

	let plotName: string = $derived.by(() => {
		if (!selectedSolution || !selectedSolution.solution_name) {
			return '';
		}
		let solutionNames = selectedSolution.solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selectedSolution.scenario_name,
			'balance',
			selectedCarrier,
			selectedNode,
			selectedYear
		].join('_');
	});
	let dualsPlotName: string = $derived.by(() => {
		return plotName + '_duals';
	});
	let unit = $derived.by(() => {
		if (unitData === null) {
			return '';
		}
		let unitEntry = unitData.find((entry) => entry['carrier'] === selectedCarrier);
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

	let plotOptions: ChartOptions = $derived.by(() => getPlotOptions(`Energy [${unit}]`));
	let dualsPlotOptions: ChartOptions = $derived.by(() =>
		getPlotOptions(`Shadow Price [${dualUnit}]`, 5, false)
	);

	function getPlotOptions(
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

	//#region Effects to manage URL parameters and data fetching

	$effect(() => {
		years;
		untrack(() => {
			if (selectedSolution === null || selectedYear === null) return;
			else if (!years.includes(Number(selectedYear))) {
				selectedYear = null;
			}
		});
	});
	$effect(() => {
		nodes;
		untrack(() => {
			if (selectedSolution === null || selectedNode === null) return;
			else if (!nodes.includes(selectedNode)) {
				selectedNode = null;
			}
		});
	});
	$effect(() => {
		carriers;
		untrack(() => {
			if (selectedSolution === null || selectedCarrier === null) return;
			else if (!carriers.includes(selectedCarrier)) {
				selectedCarrier = null;
			}
		});
	});

	$effect(() => {
		selectedSolution;
		selectedYear;
		selectedNode;
		selectedCarrier;
		selectedWindowSize;
		untrack(fetchData);
	});

	// Set URL parameters
	onMount(() => {
		selectedYear = getURLParam('year') || selectedYear;
		selectedNode = getURLParam('node') || selectedNode;
		selectedCarrier = getURLParam('car') || selectedCarrier;
		selectedWindowSize = getURLParam('window') || selectedWindowSize;
	});

	$effect(() => {
		// Triggers
		selectedYear;
		selectedNode;
		selectedCarrier;
		selectedWindowSize;

		tick().then(() => {
			updateURLParams({
				year: selectedYear,
				node: selectedNode,
				car: selectedCarrier,
				window: selectedWindowSize
			});
		});
	});

	//#endregion

	//#region Fetch data

	let windowSize = $derived(
		{
			Daily: 24,
			Weekly: 168,
			Monthly: 720
		}[selectedWindowSize] || 1 // Default to hourly (1 hour)
	);

	async function fetchData() {
		if (
			selectedNode == null ||
			selectedCarrier == null ||
			selectedYear == null ||
			selectedSolution == null
		) {
			return;
		}

		fetching = true;

		// Fetch the energy balance data
		const responses = await Promise.all([
			fetchEnergyBalance(
				selectedSolution.solution_name,
				selectedNode,
				selectedCarrier,
				selectedSolution.scenario_name,
				Number(selectedYear),
				windowSize
			),
			fetchUnit(
				selectedSolution.solution_name,
				getVariableName('flow_export', selectedSolution.version)
			),
			fetchUnit(
				selectedSolution.solution_name,
				selectedSolution.objective === 'total_cost'
					? getVariableName('net_present_cost', selectedSolution.version)
					: getVariableName('carbon_emissions_cumulative', selectedSolution.version)
			)
		]);

		energyBalanceData = responses[0];
		unitData = responses[1].data;
		unitObjectiveData = responses[2].data;

		fetching = false;
		updateDatasets();
	}

	//#endregion

	//#region Compute datasets

	let labels: string[] = $derived.by(() => {
		return Array.from({ length: numberOfTimeSteps }, (_, i) => i.toString());
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = [];
	let dualsDatasets: ChartDataset<'bar' | 'line'>[] = [];
	let datasetsLength: number = $state(0);
	let dualsDatasetsLength: number = $state(0);
	let numberOfTimeSteps: number = $state(0);
	const dualsKey = 'constraint_nodal_energy_balance';

	function computeDatasets(): ChartDataset<'bar' | 'line'>[] {
		if (
			!selectedSolution ||
			!selectedNode ||
			!selectedCarrier ||
			!selectedYear ||
			!energyBalanceData
		) {
			return [];
		}

		const version = selectedSolution!.version;
		const labelMap: Record<string, (label: string) => string> = {
			[getVariableName('flow_storage_discharge', version)]: (l) => l + ' (discharge)',
			[getVariableName('flow_transport_in', version)]: (l) => l + ' (transport in)',
			[getVariableName('flow_import', version)]: () => 'Import',
			[getVariableName('shed_demand', version)]: () => 'Shed Demand',
			[getVariableName('flow_storage_charge', version)]: (l) => l + ' (charge)',
			[getVariableName('flow_transport_out', version)]: (l) => l + ' (transport out)',
			[getVariableName('flow_export', version)]: () => 'Export'
		};

		return Object.entries(energyBalanceData).flatMap(([key, entries]: [string, Entries]) => {
			if (!entries || entries.length === 0 || key === dualsKey) {
				return [];
			}

			// Filter and group rows by label (technology/node/label)
			entries = entries
				.filterByCriteria({
					node: [selectedNode!]
				})
				.groupBy(['technology', 'node', 'label']);

			return entries.toArray().map(({ data, index }) => {
				const label = index.technology || index.node || index.label || '';
				const color = nextColor();
				const datasetData = Object.values(data).map((value, i) => ({ x: i, y: value }));

				if (key == 'demand') {
					return {
						data: datasetData,
						label: 'Demand',
						type: 'line',
						stack: 'ownCustomStack',
						fill: false,
						borderColor: 'black',
						backgroundColor: 'white',
						borderWidth: 2,
						stepped: true,
						pointRadius: Object.keys(data).length == 1 ? 2 : 0
					} as ChartDataset<'bar' | 'line'>;
				} else {
					return {
						data: datasetData,
						label: labelMap[key]?.(label) || label,
						fill: 'origin',
						borderColor: color,
						backgroundColor: color,
						stepped: true,
						cubicInterpolationMode: 'monotone',
						pointRadius: Object.keys(data).length == 1 ? 2 : 0
					} as ChartDataset<'bar' | 'line'>;
				}
			});
		});
	}

	function computeDualsDatasets() {
		if (
			!selectedSolution ||
			!selectedNode ||
			!selectedCarrier ||
			!selectedYear ||
			!energyBalanceData ||
			!energyBalanceData[dualsKey]?.length
		) {
			return [];
		}

		return energyBalanceData[dualsKey]
			.toArray()
			.map((entry) => {
				if (entry.data.length == 0) {
					return null;
				}

				let datasetData = entry.data.map((value, i) => ({ x: i, y: value }));

				return {
					data: datasetData,
					label: `shadow_price_${entry.index.carrier}_${entry.index.node}`,
					fill: false,
					borderColor: 'rgb(0, 0, 0)',
					backgroundColor: 'rgb(0, 0, 0)',
					borderWidth: 2,
					stepped: true,
					cubicInterpolationMode: 'monotone',
					pointRadius: entry.data.length == 1 ? 2 : 0
				} as ChartDataset<'bar' | 'line'>;
			})
			.filter((dataset) => dataset !== null);
	}

	async function updateDatasets() {
		resetColorState();
		datasets = computeDatasets();
		datasetsLength = datasets.length;
		numberOfTimeSteps = datasetsLength > 0 ? datasets[0].data.length : 0;
		dualsDatasets = computeDualsDatasets();
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
				bind:selected_solution={selectedSolution}
				bind:carriers
				bind:nodes
				bind:years
				bind:loading={solutionLoading}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && selectedSolution !== null}
			<FilterSection title="Data Selection">
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
				{/if}
				{#if selectedCarrier !== null && selectedYear !== null}
					<Dropdown
						options={nodes}
						bind:value={selectedNode}
						label="Node"
						disabled={fetching || solutionLoading}
					></Dropdown>
				{/if}
				{#if selectedCarrier !== null && selectedYear !== null && selectedNode !== null}
					<Dropdown
						options={windowSizes}
						bind:value={selectedWindowSize}
						label="Smoothing Window Size"
						disabled={fetching || solutionLoading}
					>
						{#snippet helpText()}
							Visualize the rolling average of hourly values over a longer time period
						{/snippet}
					</Dropdown>
				{/if}
			</FilterSection>
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[plot as Chart, dualsPlot as Chart]} downloadable zoomable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers available for the selected solution"></ErrorMessage>
		{:else if selectedCarrier == null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if selectedYear == null}
			<WarningMessage message="Please select a year"></WarningMessage>
		{:else if selectedNode == null}
			<WarningMessage message="Please select a node"></WarningMessage>
		{:else if datasetsLength == 0 || selectedSolution == null}
			<ErrorMessage message="No data with this selection"></ErrorMessage>
		{:else}
			<Chart
				type={numberOfTimeSteps == 1 ? 'bar' : 'line'}
				{labels}
				getDatasets={() => datasets}
				options={plotOptions}
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
							Shadow price of the nodal energy balance of carrier {selectedCarrier}. Indicates the
							change in total cost for the next marginal unit of demand.
						</HelpTooltip>
					</h2>
					<Chart
						id="chart-duals"
						type={numberOfTimeSteps == 1 ? 'bar' : 'line'}
						{labels}
						getDatasets={() => dualsDatasets}
						options={dualsPlotOptions}
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
