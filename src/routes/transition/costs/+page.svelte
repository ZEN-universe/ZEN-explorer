<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';

	import SolutionFilter from '$components/solutions/SolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';
	import Chart from '$components/Chart.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import FilterRow from '$components/FilterRow.svelte';

	import { get_component_total } from '$lib/temple';
	import { removeDuplicates, toOptions } from '$lib/utils';
	import {
		getURLParamAsBoolean,
		getURLParamAsIntArray,
		updateURLParams,
		type URLParams
	} from '$lib/queryParams.svelte';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import { get_variable_name } from '$lib/variables';
	import { updateSelectionOnStateChanges } from '$lib/filterSelection.svelte';
	import Entries from '$lib/entries';
	import { debounce } from '$lib/debounce';

	const technologyCarrierLabel = 'Technology / Carrier';
	const capexSuffix = ' (Capex)';
	const opexSuffix = ' (Opex)';
	const capexLabel = 'Capex';
	const opexLabel = 'Opex';
	const carrierLabel = 'Carrier';
	const shedDemandLabel = 'Shed Demand';

	let carriers: string[] = $state([]);
	let nodes: string[] = $state([]);
	let years: number[] = $state([]);
	const aggregationOptions: string[] = ['Location', technologyCarrierLabel];

	let fetchedCapex: Row[] = $state([]);
	let fetchedOpex: Row[] = $state([]);
	let fetchedCostCarbon: Row[] = $state([]);
	let fetchedCostCarrier: Row[] = $state([]);
	let fetchedCostShedDemand: Row[] = $state([]);
	let units: { [carrier: string]: string } = $state({});

	let selectedSolution: ActivatedSolution | null = $state(null);
	let selectedLocations: string[] = $state([]);
	let selectedYears: number[] = $state([]);
	let selectedCostCarriers: string[] = $state([]);
	let selectedDemandCarriers: string[] = $state([]);
	let selectedTransportTechnologies: string[] = $state([]);
	let selectedStorageTechnologies: string[] = $state([]);
	let selectedConversionTechnologies: string[] = $state([]);
	let selectedAggregation: string = $state('Location');

	let urlTransportTechnologies: number[] | null = null;
	let urlConversionTechnologies: number[] | null = null;
	let urlStorageTechnologies: number[] | null = null;
	let urlCostCarriers: number[] | null = null;
	let urlDemandCarriers: number[] | null = null;
	let previousTransportTechnologies: string = '';
	let previousConversionTechnologies: string = '';
	let previousStorageTechnologies: string = '';
	let previousCostCarriers: string = '';
	let previousDemandCarriers: string = '';
	let previousLocations: string = '';
	let previousYears: string = '';

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	interface Variable {
		title: string;
		show: boolean;
		subdivision: boolean;
		showSubdivision: boolean;
		label?: string;
	}
	let variables: { [id: string]: Variable } = $state({
		capex: {
			title: 'Capex',
			show: true,
			subdivision: false,
			showSubdivision: true,
			label: capexLabel
		},
		opex: {
			title: 'Opex',
			show: true,
			subdivision: false,
			showSubdivision: true,
			label: opexLabel
		},
		carrier: {
			title: 'Carrier',
			show: true,
			subdivision: false,
			showSubdivision: true,
			label: carrierLabel
		},
		shed_demand: {
			title: 'Shed Demand',
			show: true,
			subdivision: false,
			showSubdivision: true,
			label: shedDemandLabel
		},
		carbon_emission: {
			title: 'Carbon Emissions',
			show: true,
			subdivision: false,
			showSubdivision: false
		}
	});

	// Plot configuration
	let plotName = $derived.by(() => {
		if (!selectedSolution) {
			return '';
		}
		let solutionNames = selectedSolution.solution_name.split('.');
		return [solutionNames[solutionNames.length - 1], selectedSolution.scenario_name, 'costs'].join(
			'_'
		);
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
					text: `Costs [${unit}]`
				}
			}
		},
		interaction: {
			intersect: false,
			mode: 'nearest',
			axis: 'x'
		}
	});
	let plotPluginOptions = {
		tooltip: {
			callbacks: {
				label: (item: TooltipItem<keyof ChartTypeRegistry>) =>
					`${item.dataset.label}: ${item.formattedValue} ${unit}`
			}
		}
	};

	let labels: string[] = $derived.by(() => {
		return selectedYears.map((year) => year.toString());
	});

	// Technologies, carriers and locations
	let setCapexOpexTechnologies: Set<string> = $derived.by(() => {
		if (!fetchedCapex.length || !fetchedOpex.length) {
			return new Set<string>();
		}
		return new Set([
			...(fetchedCapex.map((row) => row['technology']) || []),
			...(fetchedOpex.map((row) => row['technology']) || [])
		]);
	});

	let transportTechnologies: string[] = $derived.by(() => {
		if (!selectedSolution || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		return selectedSolution.detail.system.set_transport_technologies
			.filter((t) => setCapexOpexTechnologies.has(t))
			.sort();
	});
	let conversionTechnologies: string[] = $derived.by(() => {
		if (!selectedSolution || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		return removeDuplicates(
			selectedSolution.detail.system.set_conversion_technologies.filter((t) =>
				setCapexOpexTechnologies.has(t)
			)
		).sort();
	});
	let storageTechnologies: string[] = $derived.by(() => {
		if (!selectedSolution || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		return removeDuplicates(
			selectedSolution.detail.system.set_storage_technologies.filter((t) =>
				setCapexOpexTechnologies.has(t)
			)
		).sort();
	});

	let costCarriers: string[] = $derived.by(() => {
		if (!selectedSolution || !fetchedCostCarrier.length) {
			return [];
		}
		return removeDuplicates(fetchedCostCarrier.map((row) => row['carrier'])).sort();
	});

	let demandCarriers: string[] = $derived.by(() => {
		if (!selectedSolution || !fetchedCostShedDemand.length) {
			return [];
		}
		return removeDuplicates(fetchedCostShedDemand.map((row) => row['carrier'])).sort();
	});

	let locations: string[] = $derived.by(() => {
		if (!selectedSolution) {
			return [];
		}
		return Object.keys(selectedSolution.detail.edges)
			.concat(selectedSolution.detail.system.set_nodes)
			.sort();
	});

	// Reset selected values when options change
	updateSelectionOnStateChanges(
		() => transportTechnologies,
		() => !!selectedSolution && !!fetchedCapex && !!fetchedOpex,
		() => previousTransportTechnologies,
		() => urlTransportTechnologies,
		(value) => (selectedTransportTechnologies = value),
		(value) => (previousTransportTechnologies = value),
		(value) => (urlTransportTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => conversionTechnologies,
		() => !!selectedSolution && fetchedCapex.length > 0 && fetchedOpex.length > 0,
		() => previousConversionTechnologies,
		() => urlConversionTechnologies,
		(value) => (selectedConversionTechnologies = value),
		(value) => (previousConversionTechnologies = value),
		(value) => (urlConversionTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => storageTechnologies,
		() => !!selectedSolution && fetchedCapex.length > 0 && fetchedOpex.length > 0,
		() => previousStorageTechnologies,
		() => urlStorageTechnologies,
		(value) => (selectedStorageTechnologies = value),
		(value) => (previousStorageTechnologies = value),
		(value) => (urlStorageTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => costCarriers,
		() => !!selectedSolution && fetchedCostCarrier.length > 0,
		() => previousCostCarriers,
		() => urlCostCarriers,
		(value) => (selectedCostCarriers = value),
		(value) => (previousCostCarriers = value),
		(value) => (urlCostCarriers = value)
	);
	updateSelectionOnStateChanges(
		() => demandCarriers,
		() => !!selectedSolution && fetchedCostShedDemand.length > 0,
		() => previousDemandCarriers,
		() => urlDemandCarriers,
		(value) => (selectedDemandCarriers = value),
		(value) => (previousDemandCarriers = value),
		(value) => (urlDemandCarriers = value)
	);
	updateSelectionOnStateChanges(
		() => locations,
		() => !!selectedSolution,
		() => previousLocations,
		() => null,
		(value) => (selectedLocations = value),
		(value) => (previousLocations = value),
		() => {}
	);
	updateSelectionOnStateChanges(
		() => years,
		() => !!selectedSolution,
		() => previousYears,
		() => null,
		(value) => (selectedYears = value),
		(value) => (previousYears = value),
		() => {}
	);

	$effect(() => {
		selectedLocations = locations;
	});
	$effect(() => {
		selectedYears = years;
	});

	onMount(() => {
		Object.entries(variables).forEach(([key, variable]) => {
			variable.show = getURLParamAsBoolean(key, variable.show);
			variable.subdivision = getURLParamAsBoolean(key + '_sub', variable.subdivision);
		});
		urlTransportTechnologies = getURLParamAsIntArray('tran');
		urlConversionTechnologies = getURLParamAsIntArray('conv');
		urlStorageTechnologies = getURLParamAsIntArray('stor');
		urlCostCarriers = getURLParamAsIntArray('cost');
		urlDemandCarriers = getURLParamAsIntArray('demand');
	});

	$effect(() => {
		// Triggers
		selectedTransportTechnologies;
		selectedConversionTechnologies;
		selectedStorageTechnologies;
		selectedCostCarriers;
		selectedDemandCarriers;
		Object.values(variables).forEach((variable) => {
			variable.show;
			variable.subdivision;
		});

		// Wait for router to be initialized
		tick().then(() => {
			let params: URLParams = {
				tran: selectedTransportTechnologies.map((t) => transportTechnologies.indexOf(t)).join('~'),
				conv: selectedConversionTechnologies
					.map((t) => conversionTechnologies.indexOf(t))
					.join('~'),
				stor: selectedStorageTechnologies.map((t) => storageTechnologies.indexOf(t)).join('~'),
				cost: selectedCostCarriers.map((t) => costCarriers.indexOf(t)).join('~'),
				demand: selectedDemandCarriers.map((t) => demandCarriers.indexOf(t)).join('~')
			};
			Object.entries(variables).forEach(([key, variable]) => {
				params[key] = variable.show ? '1' : '0';
				params[key + '_sub'] = variable.subdivision ? '1' : '0';
			});
			updateURLParams(params);
		});
	});

	async function onSolutionChanged() {
		if (!selectedSolution) {
			return;
		}

		fetchData();
	}

	async function fetchData() {
		if (!selectedSolution) {
			return;
		}

		fetching = true;

		let responses = await get_component_total(
			selectedSolution.solution_name,
			[
				'cost_capex_yearly',
				'cost_opex_yearly',
				'cost_carbon_emissions_total',
				'cost_carrier',
				'cost_shed_demand'
			].map((variable) => {
				return get_variable_name(variable, selectedSolution?.version);
			}),
			selectedSolution.scenario_name
		);

		fetchedCapex = responses.cost_capex_yearly?.data || [];
		fetchedOpex = responses.cost_opex_yearly?.data || [];
		fetchedCostCarbon = responses.cost_carbon_emissions_total?.data || [];
		fetchedCostCarrier = responses.cost_carrier?.data || [];
		fetchedCostShedDemand = responses.cost_shed_demand?.data || [];

		if (responses.unit?.data) {
			units = Object.fromEntries(responses.unit.data.map((u) => [u.technology, u[0] || u.units]));
		}

		fetching = false;
	}

	let allSelectedTechnologies: string[] = $state([]);
	function updateAllSelectedTechnologies() {
		allSelectedTechnologies = [
			...selectedConversionTechnologies
				.concat(selectedStorageTechnologies)
				.concat(selectedTransportTechnologies)
				.flatMap((i) => [i + capexSuffix, i + opexSuffix]),
			...selectedCostCarriers,
			...selectedDemandCarriers
		];
	}
	const variableLabels = Object.values(variables)
		.filter((variable) => variable.label)
		.map((variable) => variable.label!);
	let debounceUpdateAllSelectedTechnologies = debounce(updateAllSelectedTechnologies, 100);
	$effect(() => {
		selectedConversionTechnologies;
		selectedStorageTechnologies;
		selectedTransportTechnologies;
		selectedCostCarriers;
		selectedDemandCarriers;
		debounceUpdateAllSelectedTechnologies();
	});

	let datasets: ChartDataset<'bar' | 'line'>[] = $derived.by(() => {
		if (allSelectedTechnologies.length == 0) {
			return [];
		}

		const variableToDataMap = {
			capex: Entries.fromRows(fetchedCapex).mapIndex((index) => ({
				location: index['location'],
				[technologyCarrierLabel]: index['technology'] + capexSuffix
			})),
			opex: Entries.fromRows(fetchedOpex).mapIndex((index) => ({
				location: index['location'],
				[technologyCarrierLabel]: index['technology'] + opexSuffix
			})),
			carrier: Entries.fromRows(fetchedCostCarrier)
				.filter((i) => selectedCostCarriers.includes(i.index['carrier']))
				.mapIndex((index) => ({
					location: index['node'],
					[technologyCarrierLabel]: index['carrier']
				})),
			shed_demand: Entries.fromRows(fetchedCostShedDemand)
				.filter((i) => selectedDemandCarriers.includes(i.index['carrier']))
				.mapIndex((index) => ({
					location: index['node'],
					[technologyCarrierLabel]: index['carrier']
				}))
		};

		let entries = Entries.concatenate(
			Object.entries(variableToDataMap).map(([variableName, baseEntries]) => {
				if (!variables[variableName].show) {
					return null;
				}

				const entries = baseEntries
					.filterByCriteria({
						location: selectedLocations,
						[technologyCarrierLabel]: allSelectedTechnologies.concat(variableLabels)
					})
					.filterDataByIndex(selectedYears.map((year) => years.indexOf(year)));

				if (variables[variableName].subdivision) {
					return entries;
				}

				return entries.groupBy(['location']).mapIndex((index) => ({
					location: index['location'],
					[technologyCarrierLabel]: variables[variableName].label || ''
				}));
			})
		);

		if (selectedAggregation == technologyCarrierLabel) {
			entries = entries.groupBy(['location']);
		} else {
			entries = entries.groupBy([technologyCarrierLabel]);
		}

		// Get plot data, as a base we take the grouped data adapted to the cost selection.
		resetColorState();
		const datasets: ChartDataset<'bar'>[] = entries.toArray().map((entry) => {
			const label =
				selectedAggregation == technologyCarrierLabel
					? entry.index.location
					: entry.index[technologyCarrierLabel];
			const color = nextColor(label);
			return {
				label,
				data: entry.data,
				borderColor: color,
				backgroundColor: addTransparency(color)
			};
		});

		// Get total carbon cost data
		if (fetchedCostCarbon.length === 1 && variables.carbon_emission.show) {
			const carbonCostEntries = Entries.fromRows(fetchedCostCarbon).filterDataByIndex(
				selectedYears.map((year) => years.indexOf(year))
			);
			const color = nextColor('Total Carbon Costs');
			datasets.push({
				data: carbonCostEntries.get(0)!.data,
				label: 'Total Carbon Costs',
				borderColor: color,
				backgroundColor: addTransparency(color)
			});
		}

		return datasets as ChartDataset<'bar' | 'line'>[];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Costs</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<SolutionFilter
			bind:carriers
			bind:nodes
			bind:years
			bind:selected_solution={selectedSolution}
			bind:loading={solutionLoading}
			solutionSelected={onSolutionChanged}
			disabled={fetching || solutionLoading}
		/>
	</FilterSection>
	{#if !fetching && !solutionLoading && fetchedCapex.length && selectedSolution !== null}
		<FilterSection title="Cost Selection">
			{#each Object.values(variables) as variable, i}
				<div class="row mb-2">
					<label class="col-6 col-md-3 fw-medium fs-4" for={'variables' + i}>
						{variable.title}
					</label>
					<div class="col-4 col-md-2">
						<ToggleButton formId={'variables' + i} bind:value={variable.show}></ToggleButton>
					</div>
					{#if variable.show && variable.showSubdivision}
						<label class="col-6 col-md-2" for={'subdivision' + i}>Subdivision</label>
						<div class="col-4 col-md-2">
							<ToggleButton formId={'subdivision' + i} bind:value={variable.subdivision}
							></ToggleButton>
						</div>
					{/if}
				</div>
			{/each}
		</FilterSection>
		<FilterSection title="Technology Selection">
			<h3>Technologies (for Capex/Opex)</h3>
			{#if transportTechnologies.length > 0}
				<AllCheckbox
					label="Transport"
					bind:value={selectedTransportTechnologies}
					elements={transportTechnologies}
				></AllCheckbox>
			{/if}
			{#if storageTechnologies.length > 0}
				<AllCheckbox
					label="Storage"
					bind:value={selectedStorageTechnologies}
					elements={storageTechnologies}
				></AllCheckbox>
			{/if}
			{#if conversionTechnologies.length > 0}
				<AllCheckbox
					label="Conversion"
					bind:value={selectedConversionTechnologies}
					elements={conversionTechnologies}
				></AllCheckbox>
			{/if}
			{#if costCarriers.length > 0}
				<AllCheckbox
					label="Cost of Carrier"
					bind:value={selectedCostCarriers}
					elements={costCarriers}
				></AllCheckbox>
			{/if}
			{#if demandCarriers.length > 0}
				<AllCheckbox
					label="Shed Demand"
					bind:value={selectedDemandCarriers}
					elements={demandCarriers}
				></AllCheckbox>
			{/if}
		</FilterSection>
		<FilterSection title="Data Selection">
			<FilterRow label="Aggregation">
				{#snippet content(formId)}
					<Radio {formId} options={toOptions(aggregationOptions)} bind:value={selectedAggregation}
					></Radio>
				{/snippet}
			</FilterRow>
			{#if selectedAggregation == aggregationOptions[1]}
				<AllCheckbox label="Locations" bind:value={selectedLocations} elements={locations}
				></AllCheckbox>
			{/if}
			{#if selectedYears}
				<AllCheckbox label="Years" bind:value={selectedYears} elements={years}></AllCheckbox>
			{/if}
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
	{:else if selectedSolution != null}
		{#if datasets.length == 0 || datasets[0].data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else if selectedYears.length == 0}
			<div class="text-center">Please select at least one year.</div>
		{:else}
			<Chart
				type="bar"
				{labels}
				{datasets}
				options={plotOptions}
				pluginOptions={plotPluginOptions}
				{plotName}
			></Chart>
		{/if}
	{/if}
</div>
