<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ChartDataset, ChartOptions, ChartTypeRegistry, TooltipItem } from 'chart.js';
	import { draw as drawPattern } from 'patternomaly';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Radio from '$components/forms/Radio.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
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
	import { createColorBoxItem, nextPattern, resetPatternState } from '$lib/patterns';
	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison
	} from '$lib/compareSolutions';
	import type { ColorBoxItem } from '$components/ColorBox.svelte';

	const technologyCarrierLabel = 'Technology / Carrier';
	const capexSuffix = ' (Capex)';
	const opexSuffix = ' (Opex)';
	const capexLabel = 'Capex';
	const opexLabel = 'Opex';
	const carrierLabel = 'Carrier';
	const shedDemandLabel = 'Shed Demand';

	let years: number[] = $state([]);
	const aggregationOptions: string[] = ['Location', technologyCarrierLabel];

	let fetchedCapex: Row[][] = $state([]);
	let fetchedOpex: Row[][] = $state([]);
	let fetchedCostCarbon: Row[][] = $state([]);
	let fetchedCostCarrier: Row[][] = $state([]);
	let fetchedCostShedDemand: Row[][] = $state([]);
	let units: { [carrier: string]: string } = $state({});

	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedConversionTechnologies: string[] = $state([]);
	let selectedStorageTechnologies: string[] = $state([]);
	let selectedTransportTechnologies: string[] = $state([]);
	let selectedCostCarriers: string[] = $state([]);
	let selectedDemandCarriers: string[] = $state([]);
	let selectedAggregation: string = $state('Location');
	let selectedLocations: string[] = $state([]);
	let selectedYears: number[] = $state([]);

	let urlConversionTechnologies: number[] | null = null;
	let urlStorageTechnologies: number[] | null = null;
	let urlTransportTechnologies: number[] | null = null;
	let urlCostCarriers: number[] | null = null;
	let urlDemandCarriers: number[] | null = null;
	let previousConversionTechnologies: string = '';
	let previousStorageTechnologies: string = '';
	let previousTransportTechnologies: string = '';
	let previousCostCarriers: string = '';
	let previousDemandCarriers: string = '';
	let previousLocations: string = '';
	let previousYears: string = '';

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let hasSomeUnsetSolutions: boolean = $derived(selectedSolutions.some((s) => s === null));

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
		if (!selectedSolutions[0]) {
			return '';
		}
		let solutionNames = selectedSolutions[0].solution_name.split('.');
		return [
			solutionNames[solutionNames.length - 1],
			selectedSolutions[0].scenario_name,
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
					`${item.dataset.label}: ${item.formattedValue} ${unit}`,
				title: (items: TooltipItem<keyof ChartTypeRegistry>[]) => {
					if (items.length > 0) {
						return `${items[0].label} - ${items[0].dataset.stack}`;
					}
				}
			}
		}
	};

	let labels: string[] = $derived.by(() => {
		return selectedYears.map((year) => year.toString());
	});

	// Technologies, carriers and locations
	let setCapexOpexTechnologies: Set<string> = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return new Set<string>();
		}
		return new Set([
			...(fetchedCapex.flatMap((data) => data.map((row) => row['technology'])) || []),
			...(fetchedOpex.flatMap((data) => data.map((row) => row['technology'])) || [])
		]);
	});

	let transportTechnologies: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions || setCapexOpexTechnologies.size == 0) {
			return [];
		}
		const solutions = selectedSolutions as ActivatedSolution[];
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
		const solutions = selectedSolutions as ActivatedSolution[];
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
		const solutions = selectedSolutions as ActivatedSolution[];
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
		const setCarriers = new Set<string>();
		fetchedCostCarrier.forEach((data) => {
			data.forEach((row) => {
				setCarriers.add(row['carrier']);
			});
		});
		return Array.from(setCarriers).sort();
	});

	let demandCarriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		const setCarriers = new Set<string>();
		fetchedCostShedDemand.forEach((data) => {
			data.forEach((row) => {
				setCarriers.add(row['carrier']);
			});
		});
		return Array.from(setCarriers).sort();
	});

	let locations: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}
		const solutions = selectedSolutions as ActivatedSolution[];
		const setLocations = new Set<string>();
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

	// Reset selected values when options change
	updateSelectionOnStateChanges(
		() => transportTechnologies,
		() => !!selectedSolutions[0] && !!fetchedCapex && !!fetchedOpex,
		() => previousTransportTechnologies,
		() => urlTransportTechnologies,
		(value) => (selectedTransportTechnologies = value),
		(value) => (previousTransportTechnologies = value),
		(value) => (urlTransportTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => conversionTechnologies,
		() => !!selectedSolutions[0] && fetchedCapex.length > 0 && fetchedOpex.length > 0,
		() => previousConversionTechnologies,
		() => urlConversionTechnologies,
		(value) => (selectedConversionTechnologies = value),
		(value) => (previousConversionTechnologies = value),
		(value) => (urlConversionTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => storageTechnologies,
		() => !!selectedSolutions[0] && fetchedCapex.length > 0 && fetchedOpex.length > 0,
		() => previousStorageTechnologies,
		() => urlStorageTechnologies,
		(value) => (selectedStorageTechnologies = value),
		(value) => (previousStorageTechnologies = value),
		(value) => (urlStorageTechnologies = value)
	);
	updateSelectionOnStateChanges(
		() => costCarriers,
		() => !!selectedSolutions[0] && fetchedCostCarrier.length > 0,
		() => previousCostCarriers,
		() => urlCostCarriers,
		(value) => (selectedCostCarriers = value),
		(value) => (previousCostCarriers = value),
		(value) => (urlCostCarriers = value)
	);
	updateSelectionOnStateChanges(
		() => demandCarriers,
		() => !!selectedSolutions[0] && fetchedCostShedDemand.length > 0,
		() => previousDemandCarriers,
		() => urlDemandCarriers,
		(value) => (selectedDemandCarriers = value),
		(value) => (previousDemandCarriers = value),
		(value) => (urlDemandCarriers = value)
	);
	updateSelectionOnStateChanges(
		() => locations,
		() => !!selectedSolutions[0],
		() => previousLocations,
		() => null,
		(value) => (selectedLocations = value),
		(value) => (previousLocations = value),
		() => {}
	);
	updateSelectionOnStateChanges(
		() => years,
		() => !!selectedSolutions[0],
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

	function onSolutionChanged() {
		fetchData();
	}

	async function fetchData() {
		if (selectedSolutions.some((s) => s === null)) {
			return;
		}

		fetching = true;

		const solutions = selectedSolutions as ActivatedSolution[];
		const responses = await Promise.all(
			solutions.map((solution) =>
				get_component_total(
					solution.solution_name,
					[
						'cost_capex_yearly',
						'cost_opex_yearly',
						'cost_carbon_emissions_total',
						'cost_carrier',
						'cost_shed_demand'
					].map((variable) => {
						return get_variable_name(variable, solution?.version);
					}),
					solution.scenario_name
				)
			)
		);

		fetchedCapex = responses.map((r) => r.cost_capex_yearly?.data || []);
		fetchedOpex = responses.map((r) => r.cost_opex_yearly?.data || []);
		fetchedCostCarbon = responses.map((r) => r.cost_carbon_emissions_total?.data || []);
		fetchedCostCarrier = responses.map((r) => r.cost_carrier?.data || []);
		fetchedCostShedDemand = responses.map((r) => r.cost_shed_demand?.data || []);

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

	let [datasets, patterns]: [ChartDataset<'bar' | 'line'>[], ColorBoxItem[]] = $derived.by(() => {
		if (allSelectedTechnologies.length == 0) {
			return [[], []];
		}

		resetColorState();
		resetPatternState();
		const patterns: ColorBoxItem[] = [];
		const datasets = selectedSolutions.flatMap((solution, solutionIndex) => {
			if (solution === null) {
				return [];
			}

			const variableToDataMap = {
				capex: Entries.fromRows(fetchedCapex[solutionIndex]).mapIndex((index) => ({
					location: index['location'],
					[technologyCarrierLabel]: index['technology'] + capexSuffix
				})),
				opex: Entries.fromRows(fetchedOpex[solutionIndex]).mapIndex((index) => ({
					location: index['location'],
					[technologyCarrierLabel]: index['technology'] + opexSuffix
				})),
				carrier: Entries.fromRows(fetchedCostCarrier[solutionIndex])
					.filter((i) => selectedCostCarriers.includes(i.index['carrier']))
					.mapIndex((index) => ({
						location: index['node'],
						[technologyCarrierLabel]: index['carrier']
					})),
				shed_demand: Entries.fromRows(fetchedCostShedDemand[solutionIndex])
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
			const pattern = solutionIndex > 0 ? nextPattern() : undefined;
			const suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
			patterns.push(createColorBoxItem(suffix, pattern));
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
					backgroundColor:
						pattern !== undefined
							? drawPattern(pattern, addTransparency(color))
							: addTransparency(color),
					stack: suffix
				};
			});

			// Get total carbon cost data
			if (fetchedCostCarbon[solutionIndex].length === 1 && variables.carbon_emission.show) {
				const carbonCostEntries = Entries.fromRows(
					fetchedCostCarbon[solutionIndex]
				).filterDataByIndex(selectedYears.map((year) => years.indexOf(year)));
				const color = nextColor('Total Carbon Costs');
				datasets.push({
					data: carbonCostEntries.get(0)!.data,
					label: 'Total Carbon Costs',
					borderColor: color,
					backgroundColor:
						pattern !== undefined
							? drawPattern(pattern, addTransparency(color))
							: addTransparency(color),
					stack: suffix
				});
			}

			return datasets as ChartDataset<'bar' | 'line'>[];
		});

		return [datasets, patterns];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Costs</h1>

<Filters>
	<FilterSection title="Solution Selection">
		<MultiSolutionFilter
			bind:solutions={selectedSolutions}
			bind:years
			bind:loading={solutionLoading}
			onSelected={onSolutionChanged}
			disabled={fetching || solutionLoading}
		/>
	</FilterSection>
	{#if !solutionLoading && !hasSomeUnsetSolutions}
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
				<MultiSelect
					label="Transport"
					bind:value={selectedTransportTechnologies}
					options={transportTechnologies}
				></MultiSelect>
			{/if}
			{#if storageTechnologies.length > 0}
				<MultiSelect
					label="Storage"
					bind:value={selectedStorageTechnologies}
					options={storageTechnologies}
				></MultiSelect>
			{/if}
			{#if conversionTechnologies.length > 0}
				<MultiSelect
					label="Conversion"
					bind:value={selectedConversionTechnologies}
					options={conversionTechnologies}
				></MultiSelect>
			{/if}
			{#if costCarriers.length > 0}
				<MultiSelect
					label="Cost of Carrier"
					bind:value={selectedCostCarriers}
					options={costCarriers}
				></MultiSelect>
			{/if}
			{#if demandCarriers.length > 0}
				<MultiSelect
					label="Shed Demand"
					bind:value={selectedDemandCarriers}
					options={demandCarriers}
				></MultiSelect>
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
				<MultiSelect label="Locations" bind:value={selectedLocations} options={locations}
				></MultiSelect>
			{/if}
			{#if selectedYears}
				<MultiSelect label="Years" bind:value={selectedYears} options={years}></MultiSelect>
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
	{:else if hasSomeUnsetSolutions}
		<div class="text-center">Please select at least one solution.</div>
	{:else if selectedYears.length == 0}
		<div class="text-center">Please select at least one year.</div>
	{:else if datasets.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<Chart
			type="bar"
			{labels}
			{datasets}
			options={plotOptions}
			pluginOptions={plotPluginOptions}
			{plotName}
			{patterns}
			generateLabels={generateLabelsForSolutionComparison}
			onClickLegend={onClickLegendForSolutionComparison}
		></Chart>
	{/if}
</div>
