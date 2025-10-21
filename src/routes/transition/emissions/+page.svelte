<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import { draw as drawPattern } from 'patternomaly';

	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import Chart from '$components/Chart.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';
	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';

	import { get_component_total, get_unit } from '$lib/temple';
	import { removeDuplicates, toOptions } from '$lib/utils';
	import { get_variable_name } from '$lib/variables';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { getURLParam, getURLParamAsBoolean, updateURLParams } from '$lib/queryParams.svelte';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import Entries, { type FilterCriteria } from '$lib/entries';
	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison
	} from '$lib/compareSolutions';
	import { nextPattern, resetPatternState } from '$lib/patterns';

	let technologyData: Row[][] = $state([]);
	let carrierData: Row[][] = $state([]);
	let annualData: Row[][] = $state([]);
	let cumulativeData: Row[][] = $state([]);
	let annualLimitData: Row[][] = $state([]);
	let cumulativeLimitData: Row[][] = $state([]);
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

	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedSubdivision: boolean = $state(true);
	let selectedCumulation: string = $state('Annual');
	let selectedCarriers: string[] = $state([]);
	let selectedTechnologies: string[] = $state([]);
	let selectedAggregation: string = $state('location');
	let selectedNormalization: boolean = $state(false);
	let selectedLocations: string[] = $state([]);
	let selectedYears: number[] = $state([]);

	let plotName = $derived.by(() => {
		if (!selectedSolutions[0]?.solution_name) {
			return '';
		}
		let solutionNames = selectedSolutions[0].solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selectedSolutions[0].scenario_name,
			divisionVariable
		].join('_');
	});
	let unit: string = $derived.by(() => {
		if (selectedSubdivision) {
			return Object.values(subdivisionUnits)[0] || '';
		} else {
			return Object.values(cumulationUnits)[0] || '';
		}
	});
	let plotOptions: ChartOptions = $derived({
		responsive: true,
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
					text: `Emissions` + (selectedNormalization ? '' : ` [${unit}]`)
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
	});

	const plotPluginOptions: ChartOptions['plugins'] = {
		tooltip: {
			callbacks: {
				label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
					`${item.dataset.label}: ${item.formattedValue}` +
					(selectedNormalization ? '' : ` ${unit}`),
				title: (items: TooltipItem<keyof ChartTypeRegistry>[]) => {
					if (items.length > 0) {
						return `${items[0].label} - ${items[0].dataset.stack}`;
					}
				}
			}
		}
	};

	let divisionVariable = $derived.by(() => {
		if (selectedSubdivision) {
			return get_variable_name('carbon_emissions_carrier', selectedSolutions[0]?.version);
		} else if (selectedCumulation == 'Annual') {
			return get_variable_name('carbon_emissions_annual', selectedSolutions[0]?.version);
		} else {
			return get_variable_name('carbon_emissions_cumulative', selectedSolutions[0]?.version);
		}
	});

	let technologies: string[] = $derived.by(() => {
		if (!technologyData.length) {
			return [];
		}
		return removeDuplicates(technologyData[0].map((d) => d.technology));
	});

	let carriers: string[] = $derived.by(() => {
		if (!carrierData.length) {
			return [];
		}
		return removeDuplicates(carrierData[0].map((d) => d.carrier));
	});

	let locations: string[] = $derived.by(() => {
		if (!technologyData.length && !carrierData.length) {
			return [];
		}
		return removeDuplicates(
			[...(technologyData[0] || []), ...(carrierData[0] || [])].map((d) => d.location)
		).sort();
	});

	$effect(() => {
		selectedTechnologies = technologies;
	});
	$effect(() => {
		selectedCarriers = carriers;
	});
	$effect(() => {
		selectedLocations = locations;
	});
	$effect(() => {
		selectedYears = years;
	});

	// Store parts of the selected variables in the URL
	onMount(() => {
		selectedSubdivision = getURLParamAsBoolean('subdiv', selectedSubdivision);
		selectedCumulation = getURLParam('cumul') || selectedCumulation;
	});

	$effect(() => {
		// Triggers
		selectedSubdivision;
		selectedCumulation;

		// Wait for router to be initialized
		tick().then(() => {
			updateURLParams({
				subdiv: selectedSubdivision ? '1' : '0',
				cumul: selectedCumulation
			});
		});
	});

	function onSolutionSelected() {
		fetchData();
	}

	async function fetchData() {
		if (selectedSolutions.length === 0 || selectedSolutions.some((s) => s == null)) {
			return;
		}

		fetching = true;

		const solutions = selectedSolutions as ActivatedSolution[];
		const components = {
			technology: get_variable_name('carbon_emissions_technology', solutions[0].version),
			carrier: get_variable_name('carbon_emissions_carrier', solutions[0].version),
			annual_limit: get_variable_name('carbon_emissions_annual_limit', solutions[0].version),
			budget: get_variable_name('carbon_emissions_budget', solutions[0].version),
			annual: get_variable_name('carbon_emissions_annual', solutions[0].version),
			cumulative: get_variable_name('carbon_emissions_cumulative', solutions[0].version)
		};
		let [annual_unit_data, ...responses] = await Promise.all([
			get_unit(solutions[0].solution_name, components.annual, solutions[0].scenario_name),
			...solutions.flatMap((solution) => [
				get_component_total(
					solution.solution_name,
					Object.values(components),
					solution.scenario_name,
					components.carrier
				)
			])
		]);

		technologyData = responses.map((r) => r[components.technology]?.data || []);
		carrierData = responses.map((r) => r[components.carrier]?.data || []);
		annualLimitData = responses.map((r) => r[components.annual_limit]?.data || []);
		cumulativeLimitData = responses.map((r) => r[components.budget]?.data || []);
		annualData = responses.map((r) => r[components.annual]?.data || []);
		cumulativeData = responses.map((r) => r[components.cumulative]?.data || []);

		if (responses[0].unit?.data) {
			subdivisionUnits = Object.fromEntries(
				responses[0].unit.data.map((unit) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		if (annual_unit_data.data) {
			cumulationUnits = Object.fromEntries(
				annual_unit_data.data.map((unit: any) => {
					return [unit.carrier, unit[0] || unit.units];
				})
			);
		}

		fetching = false;
	}

	let barDatasets: ChartDataset<'bar'>[] = $derived.by(() => {
		if (
			selectedSolutions.length === 0 ||
			!annualData.length ||
			!cumulativeData.length ||
			!carrierData.length ||
			!technologyData.length
		) {
			return [];
		}

		let filterCriteria: FilterCriteria;
		let groupByColumns: string[];
		if (!selectedSubdivision) {
			filterCriteria = {};
			groupByColumns = [];
		} else if (selectedAggregation == 'location') {
			filterCriteria = {
				technology_carrier: selectedTechnologies.concat(selectedCarriers),
				location: selectedLocations
			};
			groupByColumns = ['technology_carrier'];
		} else {
			filterCriteria = {
				technology_carrier: selectedTechnologies.concat(selectedCarriers),
				location: selectedLocations
			};
			groupByColumns = ['location'];
		}

		resetColorState();
		resetPatternState();
		return selectedSolutions.flatMap((solution, solutionIndex) => {
			if (!solution) {
				return [];
			}

			let entries: Entries;
			if (selectedSubdivision) {
				entries = Entries.concatenate([
					Entries.fromRows(carrierData[solutionIndex]).mapIndex((d) => ({
						...d,
						technology_carrier: d.carrier,
						location: d.node
					})),
					Entries.fromRows(technologyData[solutionIndex]).mapIndex((d) => ({
						...d,
						technology_carrier: d.technology
					}))
				]);
			} else if (selectedCumulation == 'Annual') {
				entries = Entries.fromRows(annualData[solutionIndex]);
			} else {
				entries = Entries.fromRows(cumulativeData[solutionIndex]);
			}

			entries = entries
				.filterByCriteria(filterCriteria)
				.groupBy(groupByColumns)
				.filterDataByIndex(selectedYears.map((year) => years.indexOf(year)));

			if (selectedNormalization) {
				entries = entries.normalize();
			}

			const suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
			const pattern = solutionIndex > 0 ? nextPattern() : undefined;
			// if (entries.length == 1) {
			// 	const entry = entries.get(0)!;
			// 	const color = nextColor(divisionVariable);
			// 	return [
			// 		{
			// 			label: divisionVariable,
			// 			data: entry.data,
			// 			borderColor: color,
			// 			backgroundColor: pattern !== undefined ? drawPattern(pattern, addTransparency(color)) : addTransparency(color),
			// 			stack: suffix
			// 		}
			// 	] as ChartDataset<'bar'>[];
			// }

			return entries.toArray().map((entry) => {
				const label =
					entries.length === 1
						? divisionVariable
						: selectedAggregation === 'location'
							? entry.index.technology_carrier
							: entry.index.location;
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
	});

	let lineDatasets: ChartDataset<'line'>[] = $derived.by(() => {
		if (
			selectedSolutions.length === 0 ||
			annualLimitData.length === 0 ||
			cumulativeLimitData.length === 0
		) {
			return [];
		}

		return selectedSolutions.flatMap((solution, solutionIndex) => {
			if (!solution) {
				return [];
			}

			let entry: number[];
			if (selectedSubdivision || selectedCumulation == 'Annual') {
				entry = Object.entries(annualLimitData[solutionIndex][0]).map(([_, i]) =>
					i === 'inf' ? Infinity : Number(i)
				);
			} else {
				const value = Number(Object.values(cumulativeLimitData[solutionIndex][0])[0]);
				entry = selectedYears.map(() => value);
			}

			const suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
			const label =
				(selectedSubdivision || selectedCumulation == 'Annual'
					? 'Annual Emissions Limit'
					: 'Carbon Emissions Budget') + ` (${suffix})`;
			const color = nextColor(label);

			return [
				{
					label,
					data: entry,
					borderColor: color,
					backgroundColor: addTransparency(color),
					type: 'line' as const
				}
			];
		});
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		return (barDatasets as ChartDataset<'bar' | 'line'>[]).concat(
			lineDatasets as ChartDataset<'bar' | 'line'>[]
		);
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Emissions</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<MultiSolutionFilter
			bind:solutions={selectedSolutions}
			bind:years
			bind:loading={solutionLoading}
			disabled={fetching || solutionLoading}
			onSelected={onSolutionSelected}
		/>
	</FilterSection>
	{#if !solutionLoading && selectedSolutions[0] !== null}
		<FilterSection title="Variable Selection">
			<FilterRow label="Subdivision">
				{#snippet content(formId)}
					<ToggleButton {formId} bind:value={selectedSubdivision}></ToggleButton>
				{/snippet}
			</FilterRow>
			{#if !selectedSubdivision}
				<FilterRow label="Cumulation">
					{#snippet content(formId)}
						<Radio
							{formId}
							options={toOptions(cumulationOptions)}
							bind:value={selectedCumulation}
							disabled={fetching || solutionLoading}
						></Radio>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
	{/if}
	{#if !solutionLoading && selectedSolutions[0] !== null && !fetching}
		<FilterSection title="Data Selection">
			{#if selectedSubdivision}
				<FilterRow label="Aggregation">
					{#snippet content(formId)}
						<Radio {formId} options={aggregationOptions} bind:value={selectedAggregation}></Radio>
					{/snippet}
				</FilterRow>
				<FilterRow label="Normalization">
					{#snippet content(formId)}
						<ToggleButton {formId} bind:value={selectedNormalization}></ToggleButton>
					{/snippet}
				</FilterRow>
				{#if selectedAggregation == 'location'}
					<AllCheckbox label="Locations" bind:value={selectedLocations} elements={locations}
					></AllCheckbox>
				{:else}
					{#if technologies.length > 0}
						<AllCheckbox
							label="Technologies"
							bind:value={selectedTechnologies}
							elements={technologies}
						></AllCheckbox>
					{/if}
					{#if carriers.length > 0}
						<AllCheckbox label="Carriers" bind:value={selectedCarriers} elements={carriers}
						></AllCheckbox>
					{/if}
				{/if}
			{/if}
			<AllCheckbox label="Years" bind:value={selectedYears} elements={years}></AllCheckbox>
		</FilterSection>
	{/if}
</Filters>
<div class="mt-4">
	{#if solutionLoading || fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if selectedSolutions.length == 0}
		<div class="text-center">No solution selected</div>
	{:else if datasets.length == 0 || selectedYears.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<Chart
			type="bar"
			labels={selectedYears.map((year) => year.toString())}
			{datasets}
			options={plotOptions}
			pluginOptions={plotPluginOptions}
			{plotName}
			generateLabels={generateLabelsForSolutionComparison}
			onClickLegend={onClickLegendForSolutionComparison}
		></Chart>
	{/if}
</div>
