<script lang="ts">
	import { untrack } from 'svelte';
	import {
		type Chart as BaseChart,
		type ChartDataset,
		type ChartOptions,
		type ChartTypeRegistry,
		type TooltipItem
	} from 'chart.js';
	import { draw as drawPattern } from 'patternomaly';
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
		generateSolutionSuffix,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import { useURLParams, QUERY_PARAM_KEYS, addParametersToPath } from '$lib/queryParams.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import { updateSelectionOnStateChanges } from '$lib/filterSelection.svelte';
	import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
	import Entries, { type FilterCriteria } from '$lib/entries';
	import {
		fetchProductionData,
		variables,
		type ProductionComponent,
		type VariableId
	} from '$lib/productionData';
	import { getInboundEdges, getTransportEdges, typedEntries } from '@/lib/utils';

	import PiePlots from './PiePlots.svelte';

	useURLParams();

	// Data
	let data: Record<ProductionComponent, Entries>[] = $state([]);
	let years: number[] = $state([]);
	let nodes: string[] = $state([]);

	// Selected values
	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedCarrier: string | null = $state(null);
	let selectedShowVariable: Record<VariableId, boolean> = $state({
		conversion: true,
		storage: true,
		transport: true,
		importExport: true,
		demandShedDemand: true
	});
	let selectedByTechnology: Partial<Record<VariableId, boolean>> = $state({
		conversion: true,
		storage: true,
		transport: true,
		importExport: false
	});
	let selectedByNode: Partial<Record<VariableId, boolean>> = $state({
		transport: false
	});
	let selectedConversionTechnologies: string[] = $state([]);
	let selectedStorageTechnologies: string[] = $state([]);
	let selectedTransportTechnologies: string[] = $state([]);
	let selectedTechnologies = $derived([
		...selectedConversionTechnologies,
		...selectedStorageTechnologies,
		...selectedTransportTechnologies
	]);
	let selectedNormalization: boolean = $state(false);
	let selectedNodes: string[] = $state([]);
	let selectedYears: string[] = $state([]);

	let activeYear: string | null = $state(null);
	let activeSolution: string | null = $state(null);

	// Temporary objects to store previous values and URL values
	let previousNodes: string = '';
	let previousYears: string = '';

	// States
	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let plotName: string = $derived.by(() => {
		if (!selectedSolutions[0]?.solution_name || !selectedCarrier) return '';
		// Define filename of the plot when downloading.
		let solution_names = selectedSolutions[0].solution_name.split('.');
		return [
			solution_names[solution_names?.length - 1],
			selectedSolutions[0].scenario_name,
			selectedCarrier
		].join('_');
	});

	let hasSomeUnsetSolutions: boolean = $derived(selectedSolutions.some((s) => s === null));

	// Units
	let units: Row[] = $state([]);
	let unit = $derived.by(() => {
		let row = null;
		if (!row && selectedCarrier) {
			row = units.find((u) => u.carrier == selectedCarrier);
		}
		if (!row) return '';
		return row[0] || row.units || '';
	});

	let chart = $state<Chart<'bar'>>();

	//#region Plot config

	let labels: string[] = $derived(selectedYears);
	let labelSuffix = $derived(selectedNormalization ? '' : ` ${unit}`);
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
						text: `Production` + (selectedNormalization ? '' : ` [${unit}]`)
					},
					max: selectedNormalization ? 1 : undefined,
					suggestedMin: selectedNormalization ? -1 : undefined
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

	// Carriers and technologies
	let carriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) return [];

		const setCarriers: Set<string> = new SvelteSet();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_carriers.forEach((carrier) => setCarriers.add(carrier));
		});
		return Array.from(setCarriers).sort();
	});

	let conversionTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selectedCarrier === null) return [];

		const setTechnologies: Set<string> = new SvelteSet();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			Object.entries(solution.detail.carriers_input)
				.concat(Object.entries(solution.detail.carriers_output))
				.filter((t) => selectedCarrier && t[1].includes(selectedCarrier))
				.forEach((t) => setTechnologies.add(t[0]));
		});
		return Array.from(setTechnologies).sort();
	});

	let storageTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selectedCarrier === null) return [];

		const setStorageTechnologies: Set<string> = new SvelteSet();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_storage_technologies.forEach((tech) => {
				if (solution.detail.reference_carrier[tech] !== selectedCarrier) {
					return;
				}
				setStorageTechnologies.add(tech);
			});
		});
		return Array.from(setStorageTechnologies).sort();
	});

	let transportTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selectedCarrier === null) return [];

		const setTransportTechnologies: Set<string> = new SvelteSet();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_transport_technologies.forEach((tech) => {
				if (solution.detail.reference_carrier[tech] !== selectedCarrier) return;
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
						solutionData.flow_import.some(({ index }) => index.carrier === selectedCarrier) ||
						solutionData.flow_export.some(({ index }) => index.carrier === selectedCarrier)
					);
				});
			case 'demandShedDemand':
				return data.some((solutionData) => {
					return (
						solutionData.shed_demand.some(({ index }) => index.carrier === selectedCarrier) ||
						solutionData.demand.some(({ index }) => index.carrier === selectedCarrier)
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
			if (!selectedSolutions) return;
			// Keep the selected carrier if it is still available, otherwise select the first one.
			if (selectedCarrier !== null && !carriers.includes(selectedCarrier)) {
				selectedCarrier = null;
			}
		});
	});

	//#region Update selection based on URL and previous selections

	updateSelectionOnStateChanges(
		() => nodes,
		() => !!selectedSolutions,
		() => previousNodes,
		() => null,
		(value) => (selectedNodes = value),
		(value) => (previousNodes = value),
		() => {}
	);
	updateSelectionOnStateChanges(
		() => years.map((y) => y.toString()),
		() => !!selectedSolutions,
		() => previousYears,
		() => null,
		(value) => (selectedYears = value),
		(value) => (previousYears = value),
		() => {}
	);

	//#endregion

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
		const solution = findSolutionBySuffix(selectedSolutions, datasets[datasetIndex].stack);
		if (!selectedCarrier || !solution) return [];
		return [
			{
				label: `Go to The Energy Balance - Nodal`,
				href: addParametersToPath('/explorer/energy_balance/nodal/', {
					[QUERY_PARAM_KEYS.solution]: solution.solution_name || '',
					[QUERY_PARAM_KEYS.scenario]: solution.scenario_name || '',
					[QUERY_PARAM_KEYS.carrier]: selectedCarrier,
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
					}) + `#${selectedCarrier}`
			}
		];
	}

	//#region Fetch and process data

	$effect(() => {
		selectedSolutions;
		selectedCarrier;
		untrack(() => {
			fetchData();
		});
	});

	// Fetch data from the API server for the current selection.
	async function fetchData() {
		if (hasSomeUnsetSolutions || selectedCarrier === null) {
			return;
		}

		fetching = true;

		const response = await Promise.all(
			selectedSolutions.map((solution) =>
				fetchProductionData(solution!, selectedCarrier!, 'demand')
			)
		);
		// Remove UnitData from the responses
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data = response.map(({ unit, ...res }) => res as Record<ProductionComponent, Entries>);
		units = response[0].unit?.data || [];

		fetching = false;
	}

	// Process plot data
	function processData(
		initialEntries: Entries,
		groupedByTechnology: boolean,
		filterByTechnologies: boolean,
		label: string,
		suffix: string = '',
		map_fn: (d: number) => number = (d) => d
	): Entries {
		if (!selectedCarrier) {
			return Entries.empty;
		}

		const filterCriteria: FilterCriteria = {
			carrier: [selectedCarrier],
			node: selectedNodes
		};
		if (filterByTechnologies) {
			filterCriteria['technology'] = selectedTechnologies;
		}
		const groupByColumns = groupedByTechnology ? ['technology'] : [];

		let entries = initialEntries
			.filterByCriteria(filterCriteria)
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))))
			.groupBy(groupByColumns)
			.mapIndex((index) => ({
				...index,
				label: groupedByTechnology ? index.technology + suffix : label
			}));

		if (map_fn !== undefined) {
			entries = entries.mapData(map_fn);
		}

		return entries;
	}

	function processTransportData(
		flowTransport: Entries,
		flowTransportLoss: Entries,
		groupedByTechnology: boolean,
		groupedByNode: boolean,
		edges: Record<string, string>
	): Entries[] {
		const outgoingEdges = getTransportEdges(edges, selectedNodes, false);
		const incomingEdges = getTransportEdges(edges, selectedNodes, true);
		const inboundEdges = getInboundEdges(edges, selectedNodes);

		// transport_in are all incoming flows, calculated as transport gain - transport loss
		const transportGains = flowTransport.filterByCriteria({
			technology: selectedTransportTechnologies,
			edge: incomingEdges
		});
		const transportLosses = flowTransportLoss.filterByCriteria({
			technology: selectedTransportTechnologies,
			edge: incomingEdges
		});
		let positiveData = transportGains
			.mapEntries((index, data) => {
				// Find loss entry with the same technology and edge
				const lossData = transportLosses.find(
					(entry) => entry.index.technology === index.technology && entry.index.edge === index.edge
				)?.data;
				// If no corresponding loss data is found, return the original gain data
				if (!lossData || lossData.length !== data.length) return { index, data };
				// Subtract loss data from gain data
				return { data: data.map((n, i) => n - lossData[i]), index };
			})
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))));

		// transport_out are all outgoing flows
		let negativeData = flowTransport
			.filterByCriteria({
				technology: selectedTransportTechnologies,
				edge: outgoingEdges
			})
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))));

		// compute transport loss within the selected nodes
		let internalTransportLoss = flowTransportLoss
			.filterByCriteria({
				technology: selectedTransportTechnologies,
				edge: inboundEdges
			})
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))));

		// Generate labels based on grouping options
		if (groupedByNode) {
			positiveData = positiveData.mapIndex((index) => {
				const [fromNode] = index.edge.split('-');
				const label = groupedByTechnology
					? `${index.technology} (transport in from ${fromNode})`
					: `Transport in (from ${fromNode})`;
				return {
					...index,
					label
				};
			});
			negativeData = negativeData.mapIndex((index) => {
				const [, toNode] = index.edge.split('-');
				const label = groupedByTechnology
					? `${index.technology} (transport out to ${toNode})`
					: `Transport out (to ${toNode})`;
				return {
					...index,
					label
				};
			});
			internalTransportLoss = internalTransportLoss.mapIndex((index) => {
				const label = groupedByTechnology
					? `${index.technology} (internal transport loss)`
					: `Internal transport loss`;
				return {
					...index,
					label
				};
			});
		} else {
			positiveData = positiveData.mapIndex((index) => {
				const label = groupedByTechnology ? `${index.technology} (transport in)` : `Transport in`;
				return {
					...index,
					label
				};
			});
			negativeData = negativeData.mapIndex((index) => {
				const label = groupedByTechnology ? `${index.technology} (transport out)` : `Transport out`;
				return {
					...index,
					label
				};
			});
			internalTransportLoss = internalTransportLoss.mapIndex((index) => {
				const label = groupedByTechnology
					? `${index.technology} (internal transport loss)`
					: `Internal transport loss`;
				return {
					...index,
					label
				};
			});
		}

		// Group by label and negate values for negative data and transport loss
		positiveData = positiveData.groupBy(['label']);
		negativeData = negativeData.mapData((d) => -d).groupBy(['label']);
		internalTransportLoss = internalTransportLoss.mapData((d) => -d).groupBy(['label']);

		return [positiveData, negativeData, internalTransportLoss];
	}

	let [datasets, patterns]: [ChartDataset<'bar'>[], ColorBoxItem[]] = $derived.by(() => {
		if (selectedNodes.length == 0 || selectedYears.length == 0 || data.length == 0) {
			return [[], []];
		}

		resetColorState();
		resetPatternState();
		const patterns: ColorBoxItem[] = [];
		let datasets: ChartDataset<'bar'>[] = selectedSolutions.flatMap((solution, i) => {
			const rows = data[i];
			if (!solution || !Object.keys(rows).length) {
				return [];
			}

			// Process data for each variable and concatenate the resulting entries.
			let entriesList: Entries[] = typedEntries(variables).flatMap(([id, variable]) => {
				if (!selectedShowVariable[id]) {
					return [];
				}

				let positiveData = rows[variable.positive];
				let negativeData = rows[variable.negative];

				// Handle transport data
				if (id === 'transport') {
					return processTransportData(
						positiveData,
						negativeData,
						selectedByTechnology[id] ?? false,
						selectedByNode[id] ?? false,
						solution.detail.edges
					);
				}

				let filteredPos: Entries = processData(
					positiveData,
					selectedByTechnology[id] ?? false,
					variable.filterByTechnologies,
					variable.positiveLabel,
					variable.positiveSuffix
				);
				let filteredNeg: Entries = processData(
					negativeData,
					selectedByTechnology[id] ?? false,
					variable.filterByTechnologies,
					variable.negativeLabel,
					variable.negativeSuffix,
					(d) => -d
				);

				return [filteredPos, filteredNeg];
			});
			let entries = Entries.concatenate(entriesList);

			// Normalize if selected
			if (selectedNormalization) {
				entries = entries.normalize();
			}

			// Convert to dataset format
			let suffix = generateSolutionSuffix(solution);
			let pattern = i > 0 ? nextPattern() : undefined;
			patterns.push(createColorBoxItem(suffix, pattern));
			return entries.toArray().map((entry) => {
				const label = entry.index.label;
				const color = nextColor(label);
				return {
					label,
					data: entry.data,
					borderColor: color,
					backgroundColor:
						pattern !== undefined
							? drawPattern(pattern, addTransparency(color))
							: addTransparency(color),
					stack: suffix
				} as ChartDataset<'bar'>;
			});
		});

		return [datasets, patterns];
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
				bind:solutions={selectedSolutions}
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
					bind:value={selectedCarrier}
					disabled={solutionLoading || fetching}
					urlParam={QUERY_PARAM_KEYS.carrier}
					unsetIfInvalid
				></Dropdown>
			</FilterSection>
			{#if selectedCarrier !== null}
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
										bind:value={selectedShowVariable[id]}
										label={variable.title}
										disabled={solutionLoading || fetching}
										urlParam={variable.shortId}
									></ToggleButton>
								</div>
								<div>
									{#if variable.showByTechnology && selectedByTechnology[id] !== undefined}
										<ToggleButton
											bind:value={selectedByTechnology[id]}
											label="by technology"
											disabled={!selectedShowVariable[id] || solutionLoading || fetching}
											urlParam={`${variable.shortId}_sub`}
										/>
									{/if}
									{#if variable.showByNode && selectedByNode[id] !== undefined}
										<ToggleButton
											bind:value={selectedByNode[id]}
											label="by node"
											disabled={!selectedShowVariable[id] || solutionLoading || fetching}
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
						bind:value={selectedConversionTechnologies}
						options={conversionTechnologies}
						label="Conversion Technologies"
						emptyText="No conversion technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.conversionTechnologies}
					></MultiSelect>
					<MultiSelect
						bind:value={selectedStorageTechnologies}
						options={storageTechnologies}
						label="Storage Technologies"
						emptyText="No storage technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.storageTechnologies}
					></MultiSelect>
					<MultiSelect
						bind:value={selectedTransportTechnologies}
						options={transportTechnologies}
						label="Transport Technologies"
						emptyText="No transport technologies available."
						disabled={solutionLoading || fetching}
						urlParam={QUERY_PARAM_KEYS.transportTechnologies}
					></MultiSelect>
				</FilterSection>
				{#if selectedCarrier !== null}
					<FilterSection title="Data Selection">
						<ToggleButton
							label="Normalization"
							bind:value={selectedNormalization}
							disabled={solutionLoading || fetching}
						></ToggleButton>
						<MultiSelect
							bind:value={selectedNodes}
							options={nodes}
							label="Nodes"
							disabled={solutionLoading || fetching}
						></MultiSelect>
						<MultiSelect
							bind:value={selectedYears}
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
		{:else if selectedCarrier == null}
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
