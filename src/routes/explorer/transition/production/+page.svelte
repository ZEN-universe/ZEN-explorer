<script lang="ts">
	import { untrack } from 'svelte';
	import {
		type Chart as BaseChart,
		type ChartDataset,
		type ChartOptions,
		type ChartTypeRegistry,
		type TooltipItem
	} from 'chart.js';
	import { SvelteSet } from 'svelte/reactivity';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import type { ColorBoxItem } from '$components/ColorBox.svelte';
	import FilterLabel from '$components/FilterLabel.svelte';
	import Spinner from '$components/Spinner.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import type { ContextMenuItem } from '$components/ContextMenu.svelte';

	import {
		findSolutionBySuffix,
		generateLabelsForSolutionComparison,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import { useURLParams, QUERY_PARAM_KEYS, addParametersToPath } from '$lib/queryParams.svelte';
	import type { ActivatedSolution, Entry, Row } from '$lib/types';
	import { fetchProductionData, variables, type VariableId } from '$lib/productionData';
	import { typedEntries } from '$lib/utils';

	import PiePlots from './PiePlots.svelte';
	import { generateDatasetsAndPatterns, type Data, type Selection } from './processData';

	useURLParams();

	// Data
	let data: Data[] = $state([]);
	let years: number[] = $state([]);
	let nodes: string[] = $state([]);

	// Selected values
	let selection: Selection = $state({
		solutions: [null],
		carrier: null,
		showVariable: {
			conversion: true,
			storage: true,
			transport: true,
			importExport: true,
			demandShedDemand: true
		},
		byTechnology: {
			conversion: true,
			storage: true,
			transport: true,
			importExport: false
		},
		byNode: {
			transport: false
		},
		conversionTechnologies: [],
		storageTechnologies: [],
		transportTechnologies: [],
		nodes: [],
		years: [],
		normalization: false
	});

	let activeYear: string | null = $state(null);
	let activeSolution: string | null = $state(null);

	// States
	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plotName: string = $derived.by(() => {
		if (!selection.solutions[0]?.solution_name || !selection.carrier) return '';
		// Define filename of the plot when downloading.
		let solution_names = selection.solutions[0].solution_name.split('.');
		return [
			solution_names[solution_names?.length - 1],
			selection.solutions[0].scenario_name,
			selection.carrier
		].join('_');
	});

	let hasSomeUnsetSolutions: boolean = $derived(selection.solutions.some((s) => s === null));

	// Units
	let units: Row[] = $state([]);
	let unit = $derived.by(() => {
		let row = null;
		if (!row && selection.carrier) {
			row = units.find((u) => u.carrier == selection.carrier);
		}
		if (!row) return '';
		return row[0] || row.units || '';
	});

	let chart = $state<Chart<'bar'>>();

	//#region Plot config

	let labels: string[] = $derived(selection.years);
	let labelSuffix = $derived(selection.normalization ? '' : ` ${unit}`);
	function getPlotOptions(): ChartOptions<'bar'> {
		return {
			datasets: {
				bar: {
					borderColor: 'rgb(255, 0, 0)',
					borderWidth: (e) => {
						if (
							!activeYear ||
							!activeSolution ||
							e.chart.data.labels?.[e.dataIndex] !== activeYear ||
							e.chart.data.datasets?.[e.datasetIndex].stack !== activeSolution
						) {
							return 0;
						}
						return 5;
					},
					borderRadius: 2,
					borderSkipped: 'middle'
				}
			},
			animation: {
				duration: 0
			},
			maintainAspectRatio: false,
			scales: {
				x: {
					stacked: true,
					title: {
						display: true,
						text: 'Year'
					}
				},
				y: {
					stacked: true,
					title: {
						display: true,
						text: `Production` + (selection.normalization ? '' : ` [${unit}]`)
					},
					max: selection.normalization ? 1 : undefined,
					suggestedMin: selection.normalization ? -1 : undefined
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
		tooltip: {
			callbacks: {
				label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
					`${item.dataset.label}: ${item.formattedValue}${labelSuffix}`,
				title: (items: TooltipItem<keyof ChartTypeRegistry>[]) => {
					if (items.length > 0) {
						return `${items[0].label} - ${items[0].dataset.stack}`;
					}
				},
				labelColor: (context) => {
					return {
						borderColor: context.dataset.backgroundColor as string,
						backgroundColor: context.dataset.backgroundColor as string,
						borderWidth: 0
					};
				}
			},
			filter: (item) => Math.abs(item.parsed.y || 0) > 1.0e-6,
			borderWidth: 0
		}
	};

	// Labels for the legend
	function generateLabels(chart: BaseChart) {
		return generateLabelsForSolutionComparison(chart).map((label) => ({
			...label,
			lineWidth: 0
		}));
	}

	//#endregion

	//#region Carriers and technologies

	let carriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) return [];

		const setCarriers: Set<string> = new SvelteSet();
		const solutions = selection.solutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_carriers.forEach((carrier) => setCarriers.add(carrier));
		});
		return Array.from(setCarriers).sort();
	});

	let conversionTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selection.carrier === null) return [];

		const setTechnologies: Set<string> = new SvelteSet();
		const solutions = selection.solutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			Object.entries(solution.detail.carriers_input)
				.concat(Object.entries(solution.detail.carriers_output))
				.filter((t) => selection.carrier && t[1].includes(selection.carrier))
				.forEach((t) => setTechnologies.add(t[0]));
		});
		return Array.from(setTechnologies).sort();
	});

	let storageTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selection.carrier === null) return [];

		const setStorageTechnologies: Set<string> = new SvelteSet();
		const solutions = selection.solutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_storage_technologies.forEach((tech) => {
				if (solution.detail.reference_carrier[tech] !== selection.carrier) {
					return;
				}
				setStorageTechnologies.add(tech);
			});
		});
		return Array.from(setStorageTechnologies).sort();
	});

	let transportTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selection.carrier === null) return [];

		const setTransportTechnologies: Set<string> = new SvelteSet();
		const solutions = selection.solutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_transport_technologies.forEach((tech) => {
				if (solution.detail.reference_carrier[tech] !== selection.carrier) return;
				setTransportTechnologies.add(tech);
			});
		});
		return Array.from(setTransportTechnologies).sort();
	});

	function hasDataForVariable(id: VariableId): boolean {
		switch (id) {
			case 'conversion':
				return conversionTechnologies.length > 0;
			case 'storage':
				return storageTechnologies.length > 0;
			case 'transport':
				return transportTechnologies.length > 0;
			case 'importExport':
				return data.some((solutionData) => {
					return (
						solutionData.flow_import.some(
							({ index }: Entry) => index.carrier === selection.carrier
						) ||
						solutionData.flow_export.some(({ index }: Entry) => index.carrier === selection.carrier)
					);
				});
			case 'demandShedDemand':
				return data.some((solutionData) => {
					return (
						solutionData.shed_demand.some(
							({ index }: Entry) => index.carrier === selection.carrier
						) || solutionData.demand.some(({ index }: Entry) => index.carrier === selection.carrier)
					);
				});
		}
		return true;
	}

	//#endregion

	// Update selected values when the corresponding options change
	$effect(() => {
		carriers;
		untrack(() => {
			if (!selection.solutions) return;
			// Keep the selected carrier if it is still available, otherwise select the first one.
			if (selection.carrier !== null && !carriers.includes(selection.carrier)) {
				selection.carrier = null;
			}
		});
	});

	//#region Chart interactions

	function onClickBar(year: string, datasetIndex: number) {
		if (!year) {
			return;
		}
		const stack = datasets[datasetIndex].stack;
		if (!stack || (activeYear === year && activeSolution === stack)) {
			activeYear = null;
			activeSolution = null;
		} else {
			activeYear = year;
			activeSolution = stack || null;
		}
	}

	function getContextMenuItems(year: string, datasetIndex: number): ContextMenuItem[] {
		const solution = findSolutionBySuffix(selection.solutions, datasets[datasetIndex].stack);
		if (!selection.carrier || !solution) return [];
		return [
			{
				label: `Go to The Energy Balance - Nodal`,
				href: addParametersToPath('/explorer/energy_balance/nodal/', {
					[QUERY_PARAM_KEYS.solution]: solution.solution_name || '',
					[QUERY_PARAM_KEYS.scenario]: solution.scenario_name || '',
					[QUERY_PARAM_KEYS.carrier]: selection.carrier,
					[QUERY_PARAM_KEYS.year]: year
				})
			},
			{
				label: `Go to The Energy System`,
				href:
					addParametersToPath('/explorer/energy_system/', {
						[QUERY_PARAM_KEYS.solution]: solution.solution_name || '',
						[QUERY_PARAM_KEYS.scenario]: solution.scenario_name || '',
						[QUERY_PARAM_KEYS.year]: year
					}) + `#${selection.carrier}`
			}
		];
	}

	//#endregion

	//#region Fetch data

	$effect(() => {
		selection.solutions;
		selection.carrier;
		untrack(fetchData);
	});

	// Fetch data from the API server for the current selection.
	async function fetchData() {
		if (hasSomeUnsetSolutions || selection.carrier === null) {
			return;
		}

		fetching = true;

		const response = await Promise.all(
			selection.solutions.map((solution) =>
				fetchProductionData(solution!, selection.carrier!, 'demand')
			)
		);
		// Remove UnitData from the responses
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data = response.map(({ unit, ...res }) => res as Data);
		units = response[0].unit?.data || [];

		fetching = false;
	}

	let [datasets, patterns]: [ChartDataset<'bar'>[], ColorBoxItem[]] = $derived.by(() => {
		return generateDatasetsAndPatterns(data, selection, years);
	});

	//#endregion
</script>

<DiagramPage
	parentTitle="The Transition Pathway"
	pageTitle="Production"
	subtitle="Annual production and consumption of a carrier"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<MultiSolutionFilter
				bind:solutions={selection.solutions}
				bind:years
				bind:nodes
				bind:loading={solutionLoading}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && !hasSomeUnsetSolutions}
			<FilterSection title="Carrier Selection">
				<Dropdown
					label="Carrier"
					options={carriers}
					bind:value={selection.carrier}
					disabled={solutionLoading || fetching}
					urlParam={QUERY_PARAM_KEYS.carrier}
					unsetIfInvalid
				></Dropdown>
			</FilterSection>
			{#if selection.carrier !== null}
				<FilterSection title="Production Component Selection">
					{#each typedEntries(variables) as [id, variable] (id)}
						{#if !hasDataForVariable(id)}
							<FilterLabel label={variable.title}></FilterLabel>
							<div class="mb-2 text-sm text-gray-500 italic">
								No data available for {variable.title}.
							</div>
						{:else}
							<div class="grid grid-cols-2">
								<div>
									<ToggleButton
										bind:value={selection.showVariable[id]}
										label={variable.title}
										disabled={solutionLoading || fetching}
										urlParam={variable.shortId}
									></ToggleButton>
								</div>
								<div>
									{#if variable.showByTechnology && selection.byTechnology[id] !== undefined}
										<ToggleButton
											bind:value={selection.byTechnology[id]}
											label="by technology"
											disabled={!selection.showVariable[id] || solutionLoading || fetching}
											urlParam={`${variable.shortId}_sub`}
										/>
									{/if}
									{#if variable.showByNode && selection.byNode[id] !== undefined}
										<ToggleButton
											bind:value={selection.byNode[id]}
											label="by node"
											disabled={!selection.showVariable[id] || solutionLoading || fetching}
											urlParam={`${variable.shortId}_node`}
										/>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</FilterSection>
				<FilterSection title="Technology Selection">
					<MultiSelect
						bind:value={selection.conversionTechnologies}
						options={conversionTechnologies}
						label="Conversion Technologies"
						emptyText="No conversion technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.conversionTechnologies}
					></MultiSelect>
					<MultiSelect
						bind:value={selection.storageTechnologies}
						options={storageTechnologies}
						label="Storage Technologies"
						emptyText="No storage technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.storageTechnologies}
					></MultiSelect>
					<MultiSelect
						bind:value={selection.transportTechnologies}
						options={transportTechnologies}
						label="Transport Technologies"
						emptyText="No transport technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.transportTechnologies}
					></MultiSelect>
				</FilterSection>
				{#if selection.carrier !== null}
					<FilterSection title="Data Selection">
						<ToggleButton
							label="Normalization"
							bind:value={selection.normalization}
							disabled={solutionLoading || fetching}
						></ToggleButton>
						<MultiSelect
							bind:value={selection.nodes}
							options={nodes}
							label="Nodes"
							disabled={solutionLoading || fetching}
						></MultiSelect>
						<MultiSelect
							bind:value={selection.years}
							options={years.map((y) => y.toString())}
							label="Years"
							disabled={solutionLoading || fetching}
						></MultiSelect>
					</FilterSection>
				{/if}
			{/if}
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[chart as Chart]} downloadable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if hasSomeUnsetSolutions}
			<WarningMessage message="Please select all solutions"></WarningMessage>
		{:else if selection.carrier == null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if datasets.length == 0}
			<ErrorMessage message="No data with this selection"></ErrorMessage>
		{:else}
			<Chart
				type="bar"
				{labels}
				getDatasets={() => datasets}
				getOptions={getPlotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
				{patterns}
				{generateLabels}
				resetLegendState={resetLegendStateForSolutionComparison}
				onClickLegend={onClickLegendForSolutionComparison}
				{onClickBar}
				{getContextMenuItems}
				bind:this={chart}
			></Chart>

			<PiePlots
				{datasets}
				{labels}
				bind:year={activeYear}
				bind:solution={activeSolution}
				{labelSuffix}
			></PiePlots>
		{/if}
	{/snippet}
</DiagramPage>
