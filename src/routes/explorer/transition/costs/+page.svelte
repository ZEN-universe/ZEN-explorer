<script lang="ts">
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Radio from '$components/forms/Radio.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import type { ColorBoxItem } from '$components/ColorBox.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import Spinner from '$components/Spinner.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';

	import { fetchTotal } from '$lib/temple';
	import { useURLParams } from '$lib/queryParams.svelte';
	import Entries from '$lib/entries';
	import { debounce } from '$lib/debounce';
	import {
		generateLabelsForSolutionComparison,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import { getTheme } from '$lib/theme.svelte';
	import { typedEntries } from '$lib/utils';
	import type { ActivatedSolution } from '$lib/types';

	import PiePlot from './PiePlot.svelte';
	import {
		type Selection,
		type Data,
		LABELS,
		VARIABLES,
		getCostComponentsMap,
		generateDatasetsAndPatterns
	} from './processData';

	useURLParams();

	let years: number[] = $state([]);
	const aggregationOptions: string[] = ['Location', LABELS.technologyCarrier];

	let data: Data[] = $state([]);
	let units: Record<string, string> = $state({});

	let selection: Selection = $state({
		solutions: [null],
		showVariable: {
			capex: true,
			opex: true,
			carrier: true,
			shed_demand: true,
			carbon: true,
			carbon_emission: true
		},
		withSubdivision: {
			capex: false,
			opex: false,
			carrier: false,
			shed_demand: false,
			carbon: false
		},
		transportTechnologies: [],
		conversionTechnologies: [],
		storageTechnologies: [],
		costCarriers: [],
		demandCarriers: [],
		aggregation: 'Location',
		locations: [],
		years: []
	});

	let activeYear: string | null = $state(null);
	let activeSolution: string | null = $state(null);

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);
	let hasSomeUnsetSolutions: boolean = $derived(selection.solutions.some((s) => s === null));

	let chart = $state<Chart>();

	//#region Plot configuration

	let plotName = $derived.by(() => {
		if (!selection.solutions[0]) {
			return '';
		}
		let solutionNames = selection.solutions[0].solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selection.solutions[0].scenario_name,
			'costs'
		].join('_');
	});
	let unit: string = $derived.by(() => {
		if (conversionTechnologies.length > 0) {
			return units[conversionTechnologies[0]] || '';
		} else if (transportTechnologies.length > 0) {
			return units[transportTechnologies[0]] || '';
		} else if (storageTechnologies.length > 0) {
			return units[storageTechnologies[0]] || '';
		}
		return '';
	});
	function getPlotOptions(): ChartOptions {
		return {
			datasets: {
				bar: {
					borderColor: getTheme() === 'dark' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
					borderWidth: (e) => {
						if (
							!activeYear ||
							!activeSolution ||
							e.chart.data.labels?.[e.dataIndex] !== activeYear ||
							e.chart.data.datasets[e.datasetIndex].stack !== activeSolution
						) {
							return 0;
						}
						return 7;
					},
					borderRadius: 0,
					borderSkipped: 'middle'
				}
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
						text: `Costs [${unit}]`
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

	let plotPluginOptions: ChartOptions['plugins'] = {
		tooltip: {
			callbacks: {
				label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
					`${item.dataset.label}: ${item.formattedValue} ${unit}`,
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

	let labels: string[] = $derived(selection.years);

	//#endregion

	//#region Technologies, carriers and locations

	let setCapexOpexTechnologies: Set<string> = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return new Set<string>();
		}
		return new Set([
			...(data.flatMap((d) => d.capex.entries.map(({ index }) => index.technology)) || []),
			...(data.flatMap((d) => d.opex.entries.map(({ index }) => index.technology)) || [])
		]);
	});

	let transportTechnologies: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		const solutions = selection.solutions as ActivatedSolution[];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setTechnologies: Set<string> = new Set();
		solutions.forEach((solution) => {
			solution.detail.system.set_transport_technologies.forEach((t) => {
				if (setCapexOpexTechnologies.has(t)) {
					setTechnologies.add(t);
				}
			});
		});
		return Array.from(setTechnologies).sort();
	});

	let conversionTechnologies: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		const solutions = selection.solutions as ActivatedSolution[];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setTechnologies: Set<string> = new Set();
		solutions.forEach((solution) => {
			solution.detail.system.set_conversion_technologies.forEach((t) => {
				if (setCapexOpexTechnologies.has(t)) {
					setTechnologies.add(t);
				}
			});
		});
		return Array.from(setTechnologies).sort();
	});

	let storageTechnologies: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		const solutions = selection.solutions as ActivatedSolution[];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setTechnologies: Set<string> = new Set();
		solutions.forEach((solution) => {
			solution.detail.system.set_storage_technologies.forEach((t) => {
				if (setCapexOpexTechnologies.has(t)) {
					setTechnologies.add(t);
				}
			});
		});
		return Array.from(setTechnologies).sort();
	});

	let costCarriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setCarriers: Set<string> = new Set();
		data.forEach((d) => {
			d.carrier.forEach(({ index }) => {
				setCarriers.add(index.carrier);
			});
		});
		return Array.from(setCarriers).sort();
	});

	let demandCarriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setCarriers: Set<string> = new Set();
		data.forEach((d) => {
			d.shedDemand.forEach(({ index }) => {
				setCarriers.add(index.carrier);
			});
		});
		return Array.from(setCarriers).sort();
	});

	let locations: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		const solutions = selection.solutions as ActivatedSolution[];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setLocations: Set<string> = new Set();
		solutions.forEach((solution) => {
			Object.keys(solution.detail.edges).forEach((edge) => {
				setLocations.add(edge);
			});
			solution.detail.system.set_nodes.forEach((node) => {
				setLocations.add(node);
			});
		});
		return Array.from(setLocations).sort();
	});

	$effect(() => {
		selection.locations = locations;
	});

	//#endregion

	function onClickBar(year: string, datasetIndex: number) {
		if (!year) return;

		const stack = datasets[datasetIndex].stack;
		if (!stack || (activeYear === year && activeSolution === stack)) {
			activeYear = null;
			activeSolution = null;
		} else {
			activeYear = year;
			activeSolution = stack;
		}
	}

	//#region Data fetching and processing

	function onSolutionChanged() {
		activeYear = null;
		activeSolution = null;
		fetchData();
	}

	async function fetchData() {
		if (selection.solutions.some((s) => s === null)) {
			return;
		}

		fetching = true;

		const solutions = selection.solutions as ActivatedSolution[];
		const componentsMap = getCostComponentsMap(solutions[0]?.version);

		const responses = await Promise.all(
			solutions.map((solution) =>
				fetchTotal(solution.solution_name, Object.values(componentsMap), solution.scenario_name)
			)
		);

		data = responses.map((response) => {
			return Object.fromEntries(
				Object.entries(componentsMap).map(([key, responseKey]) => {
					return [key, Entries.fromRows(response[responseKey]?.data || [])];
				})
			) as Data;
		});

		if (responses[0].unit?.data) {
			units = Object.fromEntries(
				responses[0].unit.data.map((u) => [u.technology, u[0] || u.units])
			);
		}

		fetching = false;
	}

	let allSelectedTechnologies: string[] = $state([]);
	function updateAllSelectedTechnologies() {
		allSelectedTechnologies = [
			...selection.conversionTechnologies
				.concat(selection.storageTechnologies)
				.concat(selection.transportTechnologies)
				.flatMap((i) => [i + LABELS.capexSuffix, i + LABELS.opexSuffix]),
			...selection.costCarriers,
			...selection.demandCarriers
		];
	}

	let debounceUpdateAllSelectedTechnologies = debounce(updateAllSelectedTechnologies, 100);
	$effect(() => {
		selection.conversionTechnologies;
		selection.storageTechnologies;
		selection.transportTechnologies;
		selection.costCarriers;
		selection.demandCarriers;
		debounceUpdateAllSelectedTechnologies();
	});

	let [datasets, patterns]: [ChartDataset[], ColorBoxItem[]] = $derived(
		generateDatasetsAndPatterns(data, selection, allSelectedTechnologies, years)
	);

	//#endregion
</script>

<DiagramPage
	parentTitle="The Transition Pathway"
	pageTitle="Costs"
	subtitle="Total annualized system costs by capex, opex, carrier cost, and carbon cost"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<MultiSolutionFilter
				bind:solutions={selection.solutions}
				bind:years
				bind:loading={solutionLoading}
				onSelected={onSolutionChanged}
				disabled={fetching || solutionLoading}
			/>
		</FilterSection>
		{#if !solutionLoading && !hasSomeUnsetSolutions}
			<FilterSection title="Cost Selection">
				{#each typedEntries(VARIABLES) as [id, variable] (id)}
					<div class="grid grid-cols-2">
						<div>
							<ToggleButton
								bind:value={selection.showVariable[id]}
								label={variable.title}
								urlParam={id}
							>
								{#snippet helpText()}
									{variable.helpText}
								{/snippet}
							</ToggleButton>
						</div>
						{#if selection.showVariable[id] && variable.showSubdivision}
							<div>
								<ToggleButton
									bind:value={selection.withSubdivision[id]!}
									label="with Subdivision"
									urlParam={id + '_sub'}
								/>
							</div>
						{/if}
					</div>
				{/each}
			</FilterSection>
			<FilterSection title="Technology Selection">
				{#if transportTechnologies.length > 0}
					<MultiSelect
						bind:value={selection.transportTechnologies}
						options={transportTechnologies}
						label="Transport"
						disabled={fetching || solutionLoading}
						urlParam="tran"
					></MultiSelect>
				{/if}
				{#if storageTechnologies.length > 0}
					<MultiSelect
						bind:value={selection.storageTechnologies}
						options={storageTechnologies}
						label="Storage"
						disabled={fetching || solutionLoading}
						urlParam="stor"
					></MultiSelect>
				{/if}
				{#if conversionTechnologies.length > 0}
					<MultiSelect
						bind:value={selection.conversionTechnologies}
						options={conversionTechnologies}
						label="Conversion"
						disabled={fetching || solutionLoading}
						urlParam="conv"
					></MultiSelect>
				{/if}
				{#if costCarriers.length > 0}
					<MultiSelect
						bind:value={selection.costCarriers}
						options={costCarriers}
						label="Cost of Carrier"
						disabled={fetching || solutionLoading}
						urlParam="cost"
					></MultiSelect>
				{/if}
				{#if demandCarriers.length > 0}
					<MultiSelect
						bind:value={selection.demandCarriers}
						options={demandCarriers}
						label="Shed Demand"
						disabled={fetching || solutionLoading}
						urlParam="demand"
					></MultiSelect>
				{/if}
			</FilterSection>
			<FilterSection title="Data Selection">
				<Radio
					options={aggregationOptions}
					bind:value={selection.aggregation}
					label="Aggregation"
					disabled={fetching || solutionLoading}
				></Radio>
				{#if selection.aggregation == aggregationOptions[1]}
					<MultiSelect
						bind:value={selection.locations}
						options={locations}
						label="Locations"
						disabled={fetching || solutionLoading}
					></MultiSelect>
				{/if}
				<MultiSelect
					bind:value={selection.years}
					options={years.map((year) => year.toString())}
					label="Years"
					disabled={fetching || solutionLoading}
				></MultiSelect>
			</FilterSection>
		{/if}
	{/snippet}

	{#snippet buttons()}
		<ChartButtons charts={[chart as Chart]} downloadable></ChartButtons>
	{/snippet}

	{#snippet mainContent()}
		{#if solutionLoading || fetching}
			<Spinner></Spinner>
		{:else if hasSomeUnsetSolutions}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if selection.years.length == 0}
			<WarningMessage message="Please select at least one year"></WarningMessage>
		{:else if datasets.length == 0}
			<ErrorMessage message="No data available for the selected filters"></ErrorMessage>
		{:else}
			<Chart
				type="bar"
				{labels}
				getDatasets={() => datasets}
				getOptions={getPlotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
				{patterns}
				generateLabels={generateLabelsForSolutionComparison}
				resetLegendState={resetLegendStateForSolutionComparison}
				onClickLegend={onClickLegendForSolutionComparison}
				{onClickBar}
				bind:this={chart}
			></Chart>
			<PiePlot
				datasets={datasets as ChartDataset<'bar'>[]}
				{labels}
				year={activeYear}
				solution={activeSolution}
				tooltipSuffix={` ${unit}`}
			></PiePlot>
		{/if}
	{/snippet}
</DiagramPage>
