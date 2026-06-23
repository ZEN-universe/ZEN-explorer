<script lang="ts">
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Radio from '$components/forms/Radio.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';
	import Spinner from '$components/Spinner.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';

	import { fetchTotal, fetchUnit } from '$lib/temple';
	import type { ActivatedSolution } from '$lib/types';
	import { QUERY_PARAM_KEYS, useURLParams } from '$lib/queryParams.svelte';
	import Entries from '$lib/entries';
	import {
		generateLabelsForSolutionComparison,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';

	import {
		components,
		generateBarDatasetsAndPatterns,
		generateLineDatasets,
		type Data,
		type EmissionComponent,
		type Selection
	} from './processData';

	useURLParams();

	let data: Data[] = $state([]);
	let subdivisionUnits: { [carrier: string]: string } = $state({});
	let cumulationUnits: { [carrier: string]: string } = $state({});

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let years: number[] = $state([]);
	const aggregationOptions: { label: string; value: string }[] = [
		{ label: 'Location', value: 'location' },
		{ label: 'Technology & Carrier', value: 'technology_carrier' }
	];
	const cumulationOptions: string[] = ['Annual', 'Cumulative'];

	let selection: Selection = $state({
		solutions: [null],
		subdivision: true,
		cumulation: 'Annual',
		aggregation: 'location',
		normalization: false,
		technologies: [],
		carriers: [],
		locations: [],
		years: []
	});

	let chart = $state<Chart>();

	let hasSomeUnsetSolutions: boolean = $derived(selection.solutions.some((s) => s === null));
	let isNormalized: boolean = $derived(selection.normalization && selection.subdivision);

	//#region Plot options

	let plotName = $derived.by(() => {
		if (!selection.solutions[0]?.solution_name) {
			return '';
		}
		let solutionNames = selection.solutions[0].solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selection.solutions[0].scenario_name,
			divisionVariable
		].join('_');
	});

	let unit: string = $derived.by(() => {
		if (selection.subdivision) {
			return Object.values(subdivisionUnits)[0] || '';
		} else {
			return Object.values(cumulationUnits)[0] || '';
		}
	});

	function getPlotOptions(): ChartOptions {
		return {
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
						text: `Emissions` + (isNormalized ? '' : ` [${unit}]`)
					},
					max: isNormalized ? 1 : undefined,
					suggestedMin: isNormalized ? -1 : undefined
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
					`${item.dataset.label}: ${item.formattedValue}` + (isNormalized ? '' : ` ${unit}`),
				title: (items: TooltipItem<keyof ChartTypeRegistry>[]) => {
					if (items.length > 0) {
						return `${items[0].label} - ${items[0].dataset.stack}`;
					}
				}
			}
		}
	};

	//#endregion

	//#region Derived options for filters

	let divisionVariable: EmissionComponent = $derived.by(() => {
		if (selection.subdivision) {
			return 'carbon_emissions_carrier';
		} else if (selection.cumulation == 'Annual') {
			return 'carbon_emissions_annual';
		} else {
			return 'carbon_emissions_cumulative';
		}
	});

	let technologies: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setTechnologies: Set<string> = new Set();
		data.forEach((d) => {
			d.carbon_emissions_technology.forEach((d) => setTechnologies.add(d.index.technology));
		});
		return Array.from(setTechnologies).sort();
	});

	let carriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setCarriers: Set<string> = new Set();
		data.forEach((d) => {
			d.carbon_emissions_carrier.forEach(({ index }) => setCarriers.add(index.carrier));
		});
		return Array.from(setCarriers).sort();
	});

	let locations: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setLocations: Set<string> = new Set();
		data.forEach((d) =>
			d.carbon_emissions_technology.forEach(({ index }) => setLocations.add(index.location))
		);
		data.forEach((d) =>
			d.carbon_emissions_carrier.forEach(({ index }) => setLocations.add(index.node))
		);
		return Array.from(setLocations).sort();
	});

	//#endregion

	//#region Fetch and process data

	function onSolutionSelected() {
		fetchData();
	}

	async function fetchData() {
		if (selection.solutions.length === 0 || selection.solutions.some((s) => s == null)) {
			return;
		}

		fetching = true;

		const solutions = selection.solutions as ActivatedSolution[];
		let [unitResponse, ...responses] = await Promise.all([
			fetchUnit(solutions[0].solution_name, 'carbon_emissions_annual'),
			...solutions.map((solution) =>
				fetchTotal(
					solution.solution_name,
					[...components],
					solution.scenario_name,
					'',
					'carbon_emissions_carrier'
				)
			)
		]);

		data = responses.map(
			(response) =>
				Object.fromEntries(
					components.map((component) => [
						component,
						Entries.fromRows(response[component]?.data || [])
					])
				) as Data
		);

		if (responses[0].unit?.data) {
			subdivisionUnits = Object.fromEntries(
				responses[0].unit.data.map((unit) => [unit.carrier, unit[0] || unit.units])
			);
		}

		if (unitResponse.data) {
			cumulationUnits = Object.fromEntries(
				unitResponse.data.map((unit: Record<string, string>) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	let [barDatasets, patterns] = $derived(
		generateBarDatasetsAndPatterns(data, selection, isNormalized, divisionVariable, years)
	);

	let lineDatasets = $derived(generateLineDatasets(data, selection, isNormalized));

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		return (barDatasets as ChartDataset<'bar' | 'line'>[]).concat(
			lineDatasets as ChartDataset<'bar' | 'line'>[]
		);
	});

	//#endregion
</script>

<DiagramPage
	parentTitle="The Transition Pathway"
	pageTitle="Emissions"
	subtitle="Annual or cumulative emissions"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<MultiSolutionFilter
				bind:solutions={selection.solutions}
				bind:years
				bind:loading={solutionLoading}
				disabled={fetching || solutionLoading}
				onSelected={onSolutionSelected}
			/>
		</FilterSection>
		{#if !solutionLoading && !hasSomeUnsetSolutions}
			<FilterSection title="Variable Selection">
				<ToggleButton
					bind:value={selection.subdivision}
					label="Subdivision"
					disabled={fetching || solutionLoading}
					urlParam={QUERY_PARAM_KEYS.subdivision}
				></ToggleButton>
				{#if !selection.subdivision}
					<Radio
						options={cumulationOptions}
						bind:value={selection.cumulation}
						label="Cumulation"
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.cumulation}
					></Radio>
				{/if}
			</FilterSection>
		{/if}
		{#if !solutionLoading && !hasSomeUnsetSolutions}
			<FilterSection title="Data Selection">
				{#if selection.subdivision}
					<Radio
						options={aggregationOptions}
						bind:value={selection.aggregation}
						label="Aggregation"
						disabled={fetching || solutionLoading}
					></Radio>
					<ToggleButton
						bind:value={selection.normalization}
						label="Normalization"
						disabled={fetching || solutionLoading}
					></ToggleButton>
					{#if selection.aggregation == 'location'}
						<MultiSelect
							bind:value={selection.locations}
							options={locations}
							label="Locations"
							disabled={fetching || solutionLoading}
						></MultiSelect>
					{:else}
						{#if technologies.length > 0}
							<MultiSelect
								bind:value={selection.technologies}
								options={technologies}
								label="Technologies"
								disabled={fetching || solutionLoading}
							></MultiSelect>
						{/if}
						{#if carriers.length > 0}
							<MultiSelect
								bind:value={selection.carriers}
								options={carriers}
								label="Carriers"
								disabled={fetching || solutionLoading}
							></MultiSelect>
						{/if}
					{/if}
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
		{:else if selection.solutions.length == 0 || hasSomeUnsetSolutions}
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if selection.locations.length == 0}
			<WarningMessage message="Please select at least one location"></WarningMessage>
		{:else if selection.years.length == 0}
			<WarningMessage message="Please select at least one year"></WarningMessage>
		{:else if datasets.length == 0}
			<ErrorMessage message="No data available for the selection. filters"></ErrorMessage>
		{:else}
			<Chart
				type="bar"
				labels={selection.years.map((year) => year.toString())}
				getDatasets={() => datasets}
				getOptions={getPlotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
				{patterns}
				generateLabels={generateLabelsForSolutionComparison}
				resetLegendState={resetLegendStateForSolutionComparison}
				onClickLegend={onClickLegendForSolutionComparison}
				bind:this={chart}
			></Chart>
		{/if}
	{/snippet}
</DiagramPage>
