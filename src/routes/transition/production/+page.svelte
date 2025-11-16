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

	import { get_component_total } from '$lib/temple';
	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison
	} from '$lib/compareSolutions';
	import { getTransportEdges } from '$lib/utils';
	import {
		getURLParam,
		getURLParamAsBoolean,
		getURLParamAsIntArray,
		updateURLParams,
		type URLParams
	} from '$lib/queryParams.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import PiePlots from './PiePlots.svelte';
	import { updateSelectionOnStateChanges } from '$lib/filterSelection.svelte';
	import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
	import Entries, { type FilterCriteria } from '$lib/entries';

	// Data
	let data: Row[][][] = $state([]);
	let years: number[] = $state([]);
	let nodes: string[] = $state([]);

	// Variables
	interface Variable {
		id: string;
		short_id: string;
		title: string;
		show: boolean;
		subdivision: boolean;
		show_subdivision: boolean;
		filter_by_technologies: boolean;
		positive: string;
		positive_label: string;
		positive_suffix?: string;
		negative: string;
		negative_label: string;
		negative_suffix?: string;
	}
	let variables: Variable[] = $state([
		{
			id: 'conversion',
			short_id: 'conv',
			title: 'Conversion',
			show: true,
			subdivision: false,
			show_subdivision: true,
			filter_by_technologies: true,
			positive: 'flow_conversion_output',
			positive_label: 'Conversion output',
			negative: 'flow_conversion_input',
			negative_label: 'Conversion input'
		},
		{
			id: 'storage',
			short_id: 'stor',
			title: 'Storage',
			show: true,
			subdivision: false,
			show_subdivision: true,
			filter_by_technologies: true,
			positive: 'flow_storage_discharge',
			positive_label: 'Storage discharge',
			positive_suffix: ' (discharge)',
			negative: 'flow_storage_charge',
			negative_label: 'Storage charge',
			negative_suffix: ' (charge)'
		},
		{
			id: 'transport',
			short_id: 'tran',
			title: 'Transport',
			show: true,
			subdivision: false,
			show_subdivision: true,
			filter_by_technologies: true,
			positive: 'flow_transport',
			positive_label: 'Transport in',
			positive_suffix: ' (transport in)',
			negative: 'flow_transport_loss',
			negative_label: 'Transport out',
			negative_suffix: ' (transport out)'
		},
		{
			id: 'import_export',
			short_id: 'imp_exp',
			title: 'Import/Export',
			show: true,
			subdivision: false,
			show_subdivision: false,
			filter_by_technologies: false,
			positive: 'flow_import',
			positive_label: 'Import',
			negative: 'flow_export',
			negative_label: 'Export'
		},
		{
			id: 'demand_shed_demand',
			short_id: 'dem_shed',
			title: 'Demand/Shed Demand',
			show: true,
			subdivision: false,
			show_subdivision: false,
			filter_by_technologies: false,
			positive: 'shed_demand',
			positive_label: 'Shed Demand',
			negative: 'demand',
			negative_label: 'Demand'
		}
	]);

	// Selected values
	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedCarrier: string | null = $state(null);
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
	let plot_options: ChartOptions<'bar'> = $derived.by(() => {
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
	});

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

		const setCarriers: Set<string> = new Set();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_carriers.forEach((carrier) => setCarriers.add(carrier));
		});
		return Array.from(setCarriers).sort();
	});

	let conversionTechnologies = $derived.by(() => {
		if (hasSomeUnsetSolutions || selectedCarrier === null) return [];

		const setTechnologies: Set<string> = new Set();
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

		const setStorageTechnologies: Set<string> = new Set();
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

		const setTransportTechnologies: Set<string> = new Set();
		const solutions = selectedSolutions as ActivatedSolution[];

		solutions.forEach((solution) => {
			solution.detail.system.set_transport_technologies.forEach((tech) => {
				if (solution.detail.reference_carrier[tech] !== selectedCarrier) return;
				setTransportTechnologies.add(tech);
			});
		});
		return Array.from(setTransportTechnologies).sort();
	});

	function hasDataForVariable(variable: Variable): boolean {
		switch (variable.id) {
			case 'conversion':
				return conversionTechnologies.length > 0;
			case 'storage':
				return storageTechnologies.length > 0;
			case 'transport':
				return transportTechnologies.length > 0;
			case 'import_export':
				return data.some((solutionData) => {
					return (
						solutionData[6].some((item) => item.carrier === selectedCarrier) ||
						solutionData[7].some((item) => item.carrier === selectedCarrier)
					);
				});
			case 'demand_shed_demand':
				return data.some((solutionData) => {
					return (
						solutionData[8].some((item) => item.carrier === selectedCarrier) ||
						solutionData[9].some((item) => item.carrier === selectedCarrier)
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
		variables.forEach((variable) => {
			variable.show = getURLParamAsBoolean(variable.short_id, variable.show);
			variable.subdivision = getURLParamAsBoolean(variable.short_id + '_sub', variable.subdivision);
		});
		urlConversionTechnologies = getURLParamAsIntArray('conv_tech');
		urlStorageTechnologies = getURLParamAsIntArray('stor_tech');
		urlTransportTechnologies = getURLParamAsIntArray('tran_tech');
	});

	$effect(() => {
		// Triggers
		selectedCarrier;
		variables.forEach((variable) => {
			variable.show;
			variable.subdivision;
		});
		selectedConversionTechnologies;
		selectedStorageTechnologies;

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
			variables.forEach((variable) => {
				params[variable.short_id] = variable.show ? '1' : '0';
				params[variable.short_id + '_sub'] = variable.subdivision ? '1' : '0';
			});
			updateURLParams(params);
		});
	});

	//#endregion

	// Update functions
	async function onSolutionChanged() {
		activeYear = null;
		activeSolution = null;
		await fetchData();
	}

	function onBarClick(year: string, datasetIndex: number) {
		if (!year) {
			return;
		}
		const stack = datasets[datasetIndex].stack;
		if (!stack || (activeYear === year && activeSolution === stack)) {
			activeYear = null;
			activeSolution = null;
			return;
		}
		activeYear = year;
		activeSolution = stack || null;
	}

	//#region Fetch and process data

	/**
	 * Fetch data from the API server for the current selection.
	 */
	async function fetchData() {
		if (hasSomeUnsetSolutions) {
			return;
		}

		fetching = true;
		data = [];

		const solutions = selectedSolutions as ActivatedSolution[];
		const responses = await Promise.all(
			solutions.map((solution) => {
				return get_component_total(
					solution.solution_name,
					[
						'flow_conversion_output',
						'flow_conversion_input',
						'flow_storage_discharge',
						'flow_storage_charge',
						'flow_import',
						'flow_export',
						'flow_transport',
						'flow_transport_loss',
						'shed_demand',
						'demand'
					],
					solution.scenario_name,
					'demand'
				);
			})
		);

		data = responses.map((response) => {
			return variables.flatMap((variable) => {
				return [response[variable.positive]?.data || [], response[variable.negative]?.data || []];
			});
		});

		if (responses.length > 0 && responses[0].unit?.data) {
			units = responses[0].unit.data;
		}

		fetching = false;
	}

	// Process plot data
	function process_data(
		initialEntries: Entries,
		variable: Variable,
		label: string,
		suffix: string | undefined,
		map_fn?: (d: number) => number
	): Entries {
		if (!selectedCarrier) {
			return Entries.empty();
		}

		const filterCriteria: FilterCriteria = {
			carrier: [selectedCarrier],
			node: selectedNodes
		};
		if (variable.filter_by_technologies) {
			filterCriteria['technology'] = selectedTechnologies;
		}
		const groupByColumns = variable.subdivision ? ['technology'] : [];

		let entries = initialEntries
			.filterByCriteria(filterCriteria)
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))))
			.groupBy(groupByColumns)
			.mapIndex((index) => ({
				...index,
				label: variable.subdivision ? index.technology + (suffix || '') : label
			}));

		if (map_fn !== undefined) {
			entries = entries.mapData(map_fn);
		}

		return entries;
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
			if (!solution || !rows.length) {
				return [];
			}

			let entriesList: Entries[] = variables.flatMap((variable, j) => {
				if (!variable.show) {
					return [];
				}

				let positiveData = Entries.fromRows(rows[2 * j]);
				let negativeData = Entries.fromRows(rows[2 * j + 1]);
				if (variable.id === 'transport') {
					const transport = positiveData;
					const transportLoss = negativeData;

					const transportInLoss = transportLoss.filterByCriteria({
						technology: selectedTransportTechnologies,
						edge: getTransportEdges(solution.detail.edges, selectedNodes, true)
					});
					// transport in
					positiveData = transport
						.filterByCriteria({
							technology: selectedTransportTechnologies,
							edge: getTransportEdges(solution.detail.edges, selectedNodes, true)
						})
						.mapEntries((index, data) => {
							const lossData = transportInLoss.find(
								(entry) =>
									entry.index.technology === index.technology && entry.index.edge === index.edge
							)?.data;
							if (!lossData || lossData.length !== data.length) return { index, data };
							const newData = data.map((n, i) => n - lossData[i]);
							return { data: newData, index };
						});
					// transport out
					negativeData = transport.filterByCriteria({
						technology: selectedTransportTechnologies,
						edge: getTransportEdges(solution.detail.edges, selectedNodes, false)
					});
				}

				let filteredPos: Entries = process_data(
					positiveData,
					variable,
					variable.positive_label,
					variable.positive_suffix
				);
				let filteredNeg: Entries = process_data(
					negativeData,
					variable,
					variable.negative_label,
					variable.negative_suffix,
					(d) => -d
				);

				return [filteredPos, filteredNeg];
			});

			let entries = Entries.concatenate(entriesList);

			if (selectedNormalization) {
				entries = entries.normalize();
			}

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

<DiagramPage parentTitle="The Transition Pathway" pageTitle="Production">
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
				></Dropdown>
			</FilterSection>
			{#if selectedCarrier !== null}
				<FilterSection title="Production Component Selection">
					{#each variables as variable}
						{#if !hasDataForVariable(variable)}
							<FilterLabel label={variable.title}></FilterLabel>
							<div class="text-gray-500 italic text-sm mb-2">
								No data available for {variable.title}.
							</div>
						{:else}
							<div class="grid grid-cols-2">
								<div>
									<ToggleButton bind:value={variable.show} label={variable.title}></ToggleButton>
								</div>
								{#if variable.show && variable.show_subdivision}
									<div>
										<ToggleButton bind:value={variable.subdivision} label={'with Subdivision'} />
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
						label="Conversion"
						emptyText="No conversion technologies available."
						disabled={solutionLoading || fetching}
					></MultiSelect>
					<MultiSelect
						bind:value={selectedStorageTechnologies}
						options={storageTechnologies}
						label="Storage"
						emptyText="No storage technologies available."
						disabled={solutionLoading || fetching}
					></MultiSelect>
					<MultiSelect
						bind:value={selectedTransportTechnologies}
						options={transportTechnologies}
						label="Transport"
						emptyText="No transport technologies available."
						disabled={solutionLoading || fetching}
					></MultiSelect>
				</FilterSection>
				{#if !fetching && selectedCarrier != null}
					<FilterSection title="Data Selection">
						<ToggleButton label="Normalization" bind:value={selectedNormalization}></ToggleButton>
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
		<ChartButtons chart={chart as Chart} downloadable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if hasSomeUnsetSolutions}
			<div class="text-center">Some solutions are not set.</div>
		{:else if selectedCarrier == null}
			<div class="text-center">No carrier selected.</div>
		{:else if datasets.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<Chart
				type="bar"
				{datasets}
				{labels}
				options={plot_options}
				pluginOptions={plotPluginOptions}
				{plotName}
				{patterns}
				{generateLabels}
				onClickLegend={onClickLegendForSolutionComparison}
				onClickBar={onBarClick}
				bind:this={chart}
			></Chart>

			<PiePlots {datasets} {labels} year={activeYear} solution={activeSolution} {tooltipSuffix}
			></PiePlots>
		{/if}
	{/snippet}
</DiagramPage>
