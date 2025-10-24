<script lang="ts">
	import type { ChartOptions, ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
	import { onMount, tick, untrack } from 'svelte';
	import { draw as drawPattern } from 'patternomaly';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import Chart from '$components/Chart.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';

	import { get_component_total as getComponentTotal } from '$lib/temple';
	import { toOptions } from '$lib/utils';
	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison
	} from '$lib/compareSolutions';
	import type { ActivatedSolution, Row, System } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import Entries, { type FilterCriteria } from '$lib/entries';
	import {
		createColorBoxItem,
		nextPattern,
		resetPatternState,
		type ShapeType
	} from '$lib/patterns';
	import type { ColorBoxItem } from '$components/ColorBox.svelte';

	let data: Row[][] = $state([]);

	const variables: string[] = ['capacity', 'capacity_addition'];
	const variable_labels: { [key: string]: string } = {
		capacity: 'Capacity',
		capacity_addition: 'Capacity Addition'
	};
	const technologyTypes: string[] = ['conversion', 'storage', 'transport'];
	const storageTypeOptions = ['energy', 'power'];
	const aggregationOptions = [
		{ label: 'Node', value: 'node' },
		{ label: 'Technology', value: 'technology' }
	];
	let years: number[] = $state([]);

	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedVariable: string | null = $state('capacity');
	let selectedTechnologyType: string | null = $state('conversion');
	let selectedStorageType = $state('energy');
	let selectedCarrier: string | null = $state(null);
	let selectedAggregation = $state('technology');
	let selectedNormalization: boolean = $state(false);
	let selectedLocations: string[] = $state([]);
	let selectedTechnologies: string[] = $state([]);
	let selectedYears: number[] = $state([]);

	let preferredCarrier: string | null = null;

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let hasSomeUnsetSolutions: boolean = $derived(selectedSolutions.some((s) => s === null));

	// Units
	let units: { [carrier: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacity_type = selectedTechnologyType == 'storage' ? selectedStorageType : 'power';
		return units[technologies[0] + '_' + capacity_type] || '';
	});

	// Plot config
	let labels: string[] = $derived(selectedYears.map((year) => year.toString()));
	let plotOptions: ChartOptions<'bar'> = $derived({
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
					text: `${variable_labels[selectedVariable]}` + (selectedNormalization ? '' : ` [${unit}]`)
				},
				min: selectedNormalization ? 0 : undefined,
				max: selectedNormalization ? 1 : undefined
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

	let plotName: string = $derived.by(() => {
		if (selectedSolutions[0] == null) {
			return '';
		}
		return [
			selectedSolutions[0].solution_name.split('.').pop(),
			selectedSolutions[0].scenario_name,
			selectedVariable,
			selectedTechnologyType,
			selectedCarrier
		].join('_');
	});

	// Filter options
	let technologiesPerSolution = $derived.by(() => {
		if (hasSomeUnsetSolutions || selectedTechnologyType === null) {
			return [];
		}

		const key = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selectedTechnologyType] as
			| 'set_conversion_technologies'
			| 'set_storage_technologies'
			| 'set_transport_technologies';

		return (selectedSolutions as ActivatedSolution[]).map((solution) => {
			return solution.detail.system[key] || [];
		});
	});

	let carriers: string[] = $derived.by(() => {
		if (data.length === 0 || hasSomeUnsetSolutions) {
			return [];
		}

		const setUsedCarriers: Set<string> = new Set();
		selectedSolutions.forEach((solution, solutionIndex) => {
			if (solution === null) {
				return;
			}
			data[solutionIndex].forEach((row) => {
				if (technologiesPerSolution[solutionIndex].includes(row['technology'])) {
					setUsedCarriers.add(solution.detail.reference_carrier[row['technology']]);
				}
			});
		});

		return Array.from(setUsedCarriers).sort();
	});

	let technologies: string[] = $derived.by(() => {
		if (selectedTechnologyType === null || selectedCarrier === null || hasSomeUnsetSolutions) {
			return [];
		}

		const setTechnologies: Set<string> = new Set();
		(selectedSolutions as ActivatedSolution[]).forEach((solution, solutionIndex) => {
			technologiesPerSolution[solutionIndex].forEach((tech) => {
				if (solution.detail.reference_carrier[tech] === selectedCarrier) {
					setTechnologies.add(tech);
				}
			});
		});
		return Array.from(setTechnologies).sort();
	});
	$inspect('technologies', technologies);

	let locations: string[] = $derived.by(() => {
		if (data.length === 0) {
			return [];
		}

		const setLocations: Set<string> = new Set();
		selectedSolutions.forEach((solution, index) => {
			if (solution === null) {
				return;
			}
			solution.detail.system.set_nodes.forEach((node) => setLocations.add(node));
		});
		return Array.from(setLocations).sort();
	});

	// Effects for filter options
	$effect(() => {
		carriers;

		untrack(() => {
			// Update the carriers whenever the carriers change
			if (selectedCarrier == null || !carriers.includes(selectedCarrier)) {
				if (preferredCarrier != null && carriers.includes(preferredCarrier)) {
					selectedCarrier = preferredCarrier;
				} else {
					selectedCarrier = carriers.length > 0 ? carriers[0] : null;
				}
			}
		});
	});

	$effect(() => {
		// Update the preferred carrier whenever the selected carrier changes to a non-empty value
		if (selectedCarrier == null) return;
		preferredCarrier = selectedCarrier;
	});

	$effect(() => {
		// Update the selected technologies whenever the technologies array changes
		selectedTechnologies = technologies;
	});

	$effect(() => {
		// Update the selected locations whenever the locations array changes
		selectedLocations = locations;
	});

	// Store parts of the selected variables in the URL
	onMount(() => {
		selectedVariable = getURLParam('var') || selectedVariable;
		selectedTechnologyType = getURLParam('tech') || selectedTechnologyType;
		selectedStorageType = getURLParam('stor') || selectedStorageType;
		selectedCarrier = getURLParam('car') || selectedCarrier;
	});

	$effect(() => {
		// Triggers
		selectedVariable;
		selectedTechnologyType;
		selectedStorageType;
		selectedCarrier;

		// Wait for router to be initialized
		tick().then(() => {
			updateURLParams({
				var: selectedVariable,
				tech: selectedTechnologyType,
				stor: selectedStorageType,
				car: selectedCarrier
			});
		});
	});

	function resetDataSelection() {
		selectedAggregation = 'node';
		selectedNormalization = false;
		selectedLocations = locations;
		selectedTechnologies = technologies;
		selectedYears = years;
	}

	async function onSolutionChanged() {
		// wait for all properties (e.g. years) to be updated
		await tick();
		resetDataSelection();
		await fetchData();
	}

	async function onVariableChanged() {
		resetDataSelection();
		await fetchData();
	}

	function onTechnologyTypeChanged() {
		resetDataSelection();
	}

	function onCarrierChanged() {
		resetDataSelection();
	}

	/**
	 * Fetch data from the API of the selected values in the form
	 */
	async function fetchData() {
		if (selectedVariable === null || hasSomeUnsetSolutions) {
			data = [];
			return;
		}

		fetching = true;

		const solutions = selectedSolutions as ActivatedSolution[];
		const variable = selectedVariable;
		const fetched = await Promise.all(
			solutions.map((solution) => {
				return getComponentTotal(solution.solution_name, [variable], solution.scenario_name);
			})
		);

		data = fetched.map((d) => d[variable]?.data).filter((d) => d !== undefined);

		if (fetched[0]?.unit?.data) {
			units = Object.fromEntries(
				fetched[0].unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
		}

		fetching = false;
	}

	function generateDatasets(
		data: Row[],
		solutionName: string,
		pattern?: ShapeType
	): ChartDataset<'bar'>[] {
		const filterCriteria: FilterCriteria = {};
		const groupByColumns: string[] = ['capacity_type'];

		if (selectedAggregation == 'technology') {
			// aggregate by technology
			filterCriteria['technology'] = selectedTechnologies;
			filterCriteria['location'] = locations;
			groupByColumns.push('location');
		} else {
			// aggregate by location (node)
			filterCriteria['location'] = selectedLocations;
			filterCriteria['technology'] = technologies;
			groupByColumns.push('technology');
		}

		if (selectedTechnologyType == 'storage') {
			filterCriteria['capacity_type'] = [selectedStorageType];
		}

		let entries = Entries.fromRows(data)
			.filterByCriteria(filterCriteria)
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(year)))
			.groupBy(groupByColumns);

		if (selectedNormalization) {
			entries = entries.normalize();
		}

		return entries.toArray().map((entry) => {
			const label =
				selectedAggregation === 'technology' ? entry.index.location : entry.index.technology;
			const color = nextColor(label);
			return {
				label,
				data: entry.data,
				borderColor: color,
				backgroundColor:
					pattern !== undefined
						? drawPattern(pattern, addTransparency(color))
						: addTransparency(color),
				stack: solutionName
			} as ChartDataset<'bar'>;
		});
	}

	let [datasets, patterns]: [ChartDataset<'bar'>[], ColorBoxItem[]] = $derived.by(() => {
		if (
			selectedVariable == null ||
			selectedLocations.length == 0 ||
			selectedYears.length == 0 ||
			selectedTechnologies.length == 0 ||
			data.length === 0
		) {
			return [[], []];
		}

		resetColorState();
		resetPatternState();
		const patterns: ColorBoxItem[] = [];
		const datasets: ChartDataset<'bar'>[] = selectedSolutions.flatMap((solution, index) => {
			if (solution === null || !data[index]) return [];

			const suffix = generateSolutionSuffix(solution.solution_name, solution.scenario_name);
			const pattern = index > 0 ? nextPattern() : undefined;
			patterns.push(createColorBoxItem(suffix, pattern));
			return generateDatasets(data[index], suffix, pattern);
		});
		return [datasets, patterns];
	});
</script>

<h1 class="mt-2 mb-4">The Transition Pathway &ndash; Capacity</h1>
<Filters>
	<FilterSection title="Solution Selection">
		<MultiSolutionFilter
			bind:solutions={selectedSolutions}
			bind:years
			bind:loading={solutionLoading}
			onSelected={onSolutionChanged}
			disabled={fetching || solutionLoading}
		></MultiSolutionFilter>
	</FilterSection>
	{#if !solutionLoading && selectedSolutions[0]}
		<FilterSection title="Variable Selection">
			<FilterRow label="Variable">
				{#snippet content(formId)}
					<Dropdown
						{formId}
						options={toOptions(variables)}
						bind:value={selectedVariable}
						disabled={fetching || solutionLoading}
						onUpdate={onVariableChanged}
					></Dropdown>
				{/snippet}
			</FilterRow>
			{#if selectedVariable != null}
				<FilterRow label="Technology Type">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							options={toOptions(technologyTypes)}
							bind:value={selectedTechnologyType}
							disabled={fetching || solutionLoading}
							onUpdate={onTechnologyTypeChanged}
						></Dropdown>
					{/snippet}
				</FilterRow>
				{#if selectedTechnologyType == 'storage'}
					<FilterRow label="">
						{#snippet content(formId)}
							<Radio
								{formId}
								options={toOptions(storageTypeOptions)}
								bind:value={selectedStorageType}
								onUpdate={onTechnologyTypeChanged}
								disabled={fetching || solutionLoading}
							></Radio>
						{/snippet}
					</FilterRow>
				{/if}
			{/if}
			{#if selectedTechnologyType != null && carriers.length > 0}
				<FilterRow label="Carrier">
					{#snippet content(formId)}
						<Dropdown
							{formId}
							options={toOptions(carriers)}
							bind:value={selectedCarrier}
							disabled={fetching || solutionLoading}
							onUpdate={onCarrierChanged}
						></Dropdown>
					{/snippet}
				</FilterRow>
			{/if}
		</FilterSection>
		{#if data && selectedTechnologyType && selectedCarrier && technologies.length > 0 && locations.length > 0}
			<FilterSection title="Data Selection">
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
				{#if selectedAggregation == 'technology'}
					<AllCheckbox
						label="Technologies"
						bind:value={selectedTechnologies}
						elements={technologies}
					></AllCheckbox>
				{:else}
					<AllCheckbox label="Nodes" bind:value={selectedLocations} elements={locations}
					></AllCheckbox>
				{/if}
				<AllCheckbox label="Years" bind:value={selectedYears} elements={years}></AllCheckbox>
			</FilterSection>
		{/if}
	{/if}
</Filters>
<div class="plot mt-4">
	{#if solutionLoading || fetching}
		<div class="text-center">
			<div class="spinner-border center" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{:else if technologies.length == 0}
		<div class="text-center">No technologies with this selection.</div>
	{:else if carriers.length == 0}
		<div class="text-center">No carriers with this selection.</div>
	{:else if selectedSolutions[0] == null}
		<div class="text-center">No solution selected.</div>
	{:else if locations.length == 0}
		<div class="text-center">No locations with this selection.</div>
	{:else if datasets.length == 0}
		<div class="text-center">No data with this selection.</div>
	{:else}
		<Chart
			type="bar"
			{datasets}
			{labels}
			options={plotOptions}
			pluginOptions={plotPluginOptions}
			{plotName}
			{patterns}
			generateLabels={generateLabelsForSolutionComparison}
			onClickLegend={onClickLegendForSolutionComparison}
		></Chart>
	{/if}
</div>
