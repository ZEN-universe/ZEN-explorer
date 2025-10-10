<script lang="ts">
	import type {
		Chart,
		ChartOptions,
		ChartDataset,
		TooltipItem,
		ChartTypeRegistry,
		LegendItem
	} from 'chart.js';
	import { onMount, tick, untrack } from 'svelte';
	import { draw as drawPattern } from 'patternomaly';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import AllCheckbox from '$components/AllCheckbox.svelte';
	import Radio from '$components/Radio.svelte';
	import BarPlot from '$components/BarPlot.svelte';
	import Filters from '$components/Filters.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import ToggleButton from '$components/ToggleButton.svelte';

	import { get_component_total as getComponentTotal } from '$lib/temple';
	import { remove_duplicates as removeDuplicates, to_options as toOptions } from '$lib/utils';
	import type { ActivatedSolution, Row, System } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import FilterRow from '$components/FilterRow.svelte';
	import { nextColor, resetColorState } from '$lib/colors';
	import Entries from '$lib/entries';
	import { nextPattern, resetPatternState, type ShapeType } from '$lib/patterns';

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
		},
		legend: {
			labels: {
				generateLabels: (chart: Chart) => {
					const labels: LegendItem[] = [];
					const labelNames = new Set<string>();
					chart.data.datasets.forEach((dataset, index) => {
						if (!labelNames.has(dataset.label || '')) {
							labelNames.add(dataset.label || '');
							labels.push({
								text: dataset.label || '',
								fillStyle: (dataset.backgroundColor as string) || 'black',
								strokeStyle: (dataset.borderColor as string) || 'black',
								lineWidth: (dataset.borderWidth as number) || 0,
								hidden: !chart.isDatasetVisible(index),
								datasetIndex: index
							} as LegendItem);
						}
					});
					return labels;
				}
			},
			onClick(_, legendItem, legend) {
				const chart = legend.chart;
				chart.data.datasets.forEach((dataset, i) => {
					if (dataset.label !== legendItem.text) return;
					if (chart.isDatasetVisible(i)) {
						chart.hide(i);
					} else {
						chart.show(i);
					}
				});
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
	let carriers: string[] = $derived.by(() => {
		if (data.length === 0 || selectedSolutions[0] === null) {
			return [];
		}

		const solution = selectedSolutions[0];
		const carriers: string[] = [];
		data[0].forEach((element) => {
			const currentTechnology = element.technology;
			const currentCarrier = solution.detail.reference_carrier[currentTechnology];

			if (!carriers.includes(currentCarrier) && allTechnologies.includes(element.technology)) {
				carriers.push(currentCarrier);
			}
		});

		return carriers;
	});

	let allTechnologies: string[] = $derived.by(() => {
		if (!selectedSolutions[0] || !selectedTechnologyType) {
			return [];
		}

		const solution = selectedSolutions[0];
		const key = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selectedTechnologyType] as keyof System;
		return (solution.detail.system[key] || []) as string[];
	});

	let technologies: string[] = $derived.by(() => {
		if (selectedSolutions[0] === null || selectedTechnologyType === null) {
			return [];
		}

		const solution = selectedSolutions[0];
		return allTechnologies.filter(
			(technology) => solution.detail.reference_carrier[technology] == selectedCarrier
		);
	});

	let locations: string[] = $derived.by(() => {
		if (data.length === 0) {
			return [];
		}

		return removeDuplicates(
			data[0]
				.filter((element) => technologies.includes(element.technology))
				.map((element) => element.location)
		);
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
		if (selectedVariable === null || selectedSolutions[0] === null) {
			data = [];
			return;
		}

		fetching = true;

		const variable = selectedVariable;
		const fetched = await Promise.all(
			selectedSolutions.map((solution) => {
				if (solution === null) return null;
				return getComponentTotal(solution.solution_name, [variable], solution.scenario_name);
			})
		);

		data = fetched
			.filter((d) => d !== null)
			.map((d) => d[variable]?.data)
			.filter((d) => d !== undefined);

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
		const filterCriteria: Record<string, string[]> = {};
		const groupByColumns: string[] = ['capacity_type'];

		if (selectedAggregation == 'technology') {
			// aggregate by technology
			filterCriteria['location'] = selectedLocations;
			filterCriteria['technology'] = technologies;
			groupByColumns.push('location');
		} else {
			// aggregate by location (node)
			filterCriteria['technology'] = selectedTechnologies;
			filterCriteria['location'] = locations;
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
			const label = selectedAggregation === 'technology' ? entry.index.location : entry.index.technology;
			return {
				label,
				data: entry.data,
				backgroundColor: pattern !== undefined ? drawPattern(pattern, nextColor(label)) : nextColor(label),
				stack: solutionName
			} as ChartDataset<'bar'>;
		});
	}

	let datasets: ChartDataset<'bar'>[] = $derived.by(() => {
		if (
			selectedVariable == null ||
			selectedLocations.length == 0 ||
			selectedYears.length == 0 ||
			selectedTechnologies.length == 0 ||
			data.length === 0
		) {
			return [];
		}

		resetColorState();
		resetPatternState();
		return selectedSolutions.flatMap((solution, index) => {
			if (solution === null || !data[index]) return [];

			let suffix = solution.solution_name.split('.').pop() || solution.solution_name;
			if (solution.scenario_name != 'none') {
				suffix = `${suffix} (${solution.scenario_name})`;
			}
			return generateDatasets(data[index], suffix, index > 0 ? nextPattern() : undefined);
		});
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
		<BarPlot
			type="bar"
			{datasets}
			{labels}
			options={plotOptions}
			pluginOptions={plotPluginOptions}
			plot_name={plotName}
		></BarPlot>
	{/if}
</div>
