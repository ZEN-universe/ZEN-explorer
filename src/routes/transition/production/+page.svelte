<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
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
	import PiePlots from './PiePlots.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';

	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import {
		getURLParam,
		getURLParamAsBoolean,
		getURLParamAsIntArray,
		updateURLParams,
		type URLParams
	} from '$lib/queryParams.svelte';
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
	import { getTransportEdges, typedEntries, typedKeys } from '@/lib/utils';

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
	let selectedSubdivision: Record<VariableId, boolean> = $state({
		conversion: true,
		storage: true,
		transport: true,
		importExport: false,
		demandShedDemand: false
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
	let urlConversionTechnologies: number[] | null = null;
	let urlStorageTechnologies: number[] | null = null;
	let urlTransportTechnologies: number[] | null = null;
	let previousConversionTechnologies: string = '';
	let previousStorageTechnologies: string = '';
	let previousTransportTechnologies: string = '';
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
	let tooltipSuffix = $derived(selectedNormalization ? '' : ` ${unit}`);
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
					`${item.dataset.label}: ${item.formattedValue}${tooltipSuffix}`,
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
						solutionData.flow_transport.some(({ index }) => index.carrier === selectedCarrier) ||
						solutionData.flow_transport_loss.some(({ index }) => index.carrier === selectedCarrier)
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
		() => conversionTechnologies,
		() => !!selectedSolutions,
		() => previousConversionTechnologies,
		() => urlConversionTechnologies,
		(value) => (selectedConversionTechnologies = value),
		(value) => (previousConversionTechnologies = value),
		(value) => (urlConversionTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => storageTechnologies,
		() => !!selectedSolutions,
		() => previousStorageTechnologies,
		() => urlStorageTechnologies,
		(value) => (selectedStorageTechnologies = value),
		(value) => (previousStorageTechnologies = value),
		(value) => (urlStorageTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => transportTechnologies,
		() => !!selectedSolutions,
		() => previousTransportTechnologies,
		() => urlTransportTechnologies,
		(value) => (selectedTransportTechnologies = value),
		(value) => (previousTransportTechnologies = value),
		(value) => (urlTransportTechnologies = value)
	);
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

	// Store parts of the selected variables in the URL
	onMount(() => {
		selectedCarrier = getURLParam('car') || null;
		typedKeys(variables).forEach((id) => {
			selectedShowVariable[id] = getURLParamAsBoolean(id, selectedShowVariable[id]);
			selectedSubdivision[id] = getURLParamAsBoolean(id + '_sub', selectedSubdivision[id]);
		});
		urlConversionTechnologies = getURLParamAsIntArray('conv_tech');
		urlStorageTechnologies = getURLParamAsIntArray('stor_tech');
		urlTransportTechnologies = getURLParamAsIntArray('tran_tech');
	});

	$effect(() => {
		// Triggers
		selectedCarrier;
		typedKeys(variables).forEach((id) => {
			selectedShowVariable[id];
			selectedSubdivision[id];
		});
		selectedConversionTechnologies;
		selectedStorageTechnologies;
		selectedTransportTechnologies;

		// Wait for router to be initialized
		tick().then(() => {
			let params: URLParams = {
				car: selectedCarrier,
				conv_tech: selectedConversionTechnologies
					.map((t) => conversionTechnologies.indexOf(t))
					.join('~'),
				stor_tech: selectedStorageTechnologies.map((t) => storageTechnologies.indexOf(t)).join('~'),
				tran_tech: selectedTransportTechnologies
					.map((t) => transportTechnologies.indexOf(t))
					.join('~')
			};
			typedKeys(variables).forEach((id) => {
				params[variables[id].shortId] = selectedShowVariable[id] ? '1' : '0';
				params[variables[id].shortId + '_sub'] = selectedSubdivision[id] ? '1' : '0';
			});
			updateURLParams(params);
		});
	});

	//#endregion

	// Update functions
	function onSolutionChanged() {
		activeYear = null;
		activeSolution = null;
		fetchData();
	}

	function onCarrierChanged() {
		fetchData();
	}

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

	//#region Fetch and process data

	/**
	 * Fetch data from the API server for the current selection.
	 */
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
		// Remove UnitData from the response
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		data = response.map(({ unit, ...res }) => res as Record<ProductionComponent, Entries>);
		units = response[0].unit?.data || [];

		fetching = false;
	}

	// Process plot data
	function processData(
		initialEntries: Entries,
		showSubdivision: boolean,
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
		const groupByColumns = showSubdivision ? ['technology'] : [];

		let entries = initialEntries
			.filterByCriteria(filterCriteria)
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))))
			.groupBy(groupByColumns)
			.mapIndex((index) => ({
				...index,
				label: showSubdivision ? index.technology + suffix : label
			}));

		if (map_fn !== undefined) {
			entries = entries.mapData(map_fn);
		}

		return entries;
	}

	function computeTransportData(
		positiveData: Entries,
		negativeData: Entries,
		edges: Record<string, string>
	): [Entries, Entries] {
		const outgoingEdges = getTransportEdges(edges, selectedNodes, false);
		const incomingEdges = getTransportEdges(edges, selectedNodes, true);
		const transportGains = positiveData.filterByCriteria({
			technology: selectedTransportTechnologies,
			edge: incomingEdges
		});
		const transportLosses = negativeData.filterByCriteria({
			technology: selectedTransportTechnologies,
			edge: incomingEdges
		});

		// transport_out are all outgoing flows
		negativeData = positiveData.filterByCriteria({
			technology: selectedTransportTechnologies,
			edge: outgoingEdges
		});

		// transport_in are all incoming flows, calculated as transport gain - transport loss
		positiveData = transportGains.mapEntries((index, data) => {
			// Find loss entry with the same technology and edge
			const lossData = transportLosses.find(
				(entry) => entry.index.technology === index.technology && entry.index.edge === index.edge
			)?.data;
			// If no corresponding loss data is found, return the original gain data
			if (!lossData || lossData.length !== data.length) return { index, data };
			// Subtract loss data from gain data
			return { data: data.map((n, i) => n - lossData[i]), index };
		});

		return [positiveData, negativeData];
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
					[positiveData, negativeData] = computeTransportData(
						positiveData,
						negativeData,
						solution.detail.edges
					);
				}

				let filteredPos: Entries = processData(
					positiveData,
					selectedSubdivision[id],
					variable.filterByTechnologies,
					variable.positiveLabel,
					variable.positiveSuffix
				);
				let filteredNeg: Entries = processData(
					negativeData,
					selectedSubdivision[id],
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
			let suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
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
				onSelected={onSolutionChanged}
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
					onUpdate={onCarrierChanged}
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
									></ToggleButton>
								</div>
								{#if variable.showSubdivision}
									<div>
										<ToggleButton
											bind:value={selectedSubdivision[id]}
											label="with Subdivision"
											disabled={!selectedShowVariable[id] || solutionLoading || fetching}
										/>
									</div>
								{/if}
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
					></MultiSelect>
					<MultiSelect
						bind:value={selectedStorageTechnologies}
						options={storageTechnologies}
						label="Storage Technologies"
						emptyText="No storage technologies available."
						disabled={solutionLoading || fetching}
					></MultiSelect>
					<MultiSelect
						bind:value={selectedTransportTechnologies}
						options={transportTechnologies}
						label="Transport Technologies"
						emptyText="No transport technologies available."
						disabled={solutionLoading || fetching}
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
				bind:this={chart}
			></Chart>

			<PiePlots {datasets} {labels} year={activeYear} solution={activeSolution} {tooltipSuffix}
			></PiePlots>
		{/if}
	{/snippet}
</DiagramPage>
