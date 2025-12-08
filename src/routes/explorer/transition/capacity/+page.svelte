<script lang="ts">
	import type { ChartOptions, ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
	import { onMount, tick, untrack } from 'svelte';
	import { draw as drawPattern } from 'patternomaly';

	import MultiSolutionFilter from '$components/solutions/MultiSolutionFilter.svelte';
	import MultiSelect from '$components/forms/MultiSelect.svelte';
	import Radio from '$components/forms/Radio.svelte';
	import Chart from '$components/Chart.svelte';
	import FilterSection from '$components/FilterSection.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';
	import ToggleButton from '$components/forms/ToggleButton.svelte';
	import type { ColorBoxItem } from '$components/ColorBox.svelte';
	import DiagramPage from '$components/DiagramPage.svelte';
	import ChartButtons from '$components/ChartButtons.svelte';

	import { fetchTotal } from '$lib/temple';
	import {
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison
	} from '$lib/compareSolutions';
	import type { ActivatedSolution, Row } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import { addTransparency, nextColor, resetColorState } from '$lib/colors';
	import Entries, { type FilterCriteria } from '$lib/entries';
	import {
		createColorBoxItem,
		nextPattern,
		resetPatternState,
		type ShapeType
	} from '$lib/patterns';
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';
	import { removeDuplicates } from '$lib/utils';

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
	let selectedYears: string[] = $state([]);

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

	let chart = $state<Chart<'bar'>>();

	//#region Plot config

	let labels: string[] = $derived(selectedYears.map((year) => year.toString()));
	let plotOptions: ChartOptions<'bar'> = $derived({
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

	//#endregion

	//#region Filter options

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
		if (hasSomeUnsetSolutions) {
			return [];
		}

		return removeDuplicates(
			selectedSolutions.flatMap((solution) => Object.values(solution!.detail.reference_carrier))
		).sort();
	});

	let technologies: string[] = $derived.by(() => {
		if (selectedTechnologyType === null || selectedCarrier === null || hasSomeUnsetSolutions) {
			return [];
		}

		const setTechnologies: Set<string> = new Set();
		(selectedSolutions as ActivatedSolution[]).forEach((solution, solutionIndex) => {
			(technologiesPerSolution[solutionIndex] ?? []).forEach((tech) => {
				if (solution.detail.reference_carrier[tech] === selectedCarrier) {
					setTechnologies.add(tech);
				}
			});
		});
		return Array.from(setTechnologies).sort();
	});

	let locations: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}

		const setLocations: Set<string> = new Set();
		data.forEach((items) => {
			items.forEach((d) => {
				if (technologies.includes(d.technology)) {
					setLocations.add(d.location);
				}
			});
		});
		return Array.from(setLocations).sort();
	});

	//#endregion

	//#region Filter update handlers

	$effect(() => {
		carriers;

		untrack(() => {
			// Update the carriers whenever the carriers change
			if (selectedCarrier == null || !carriers.includes(selectedCarrier)) {
				if (preferredCarrier != null && carriers.includes(preferredCarrier)) {
					selectedCarrier = preferredCarrier;
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
		fetchData();
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

	//#endregion

	//#region Data selection

	function resetDataSelection() {
		selectedAggregation = 'node';
		selectedNormalization = false;
		selectedLocations = locations;
		selectedTechnologies = technologies;
		selectedYears = years.map((y) => y.toString());
	}

	async function onSolutionChanged() {
		// wait for all properties (e.g. years) to be updated
		await tick();
		resetDataSelection();
		fetchData();
	}

	function onCarrierChanged() {
		resetDataSelection();
		fetchData();
	}

	function onVariableChanged() {
		resetDataSelection();
		fetchData();
	}

	function onTechnologyTypeChanged() {
		resetDataSelection();
	}

	//#endregion

	//#region Data fetching and processing

	/**
	 * Fetch data from the API of the selected values in the form
	 */
	async function fetchData() {
		if (selectedVariable === null || selectedCarrier === null || hasSomeUnsetSolutions) {
			data = [];
			return;
		}

		fetching = true;

		const solutions = selectedSolutions as ActivatedSolution[];
		const variable = selectedVariable;
		const fetched = await Promise.all(
			solutions.map((solution) => {
				return fetchTotal(
					solution.solution_name,
					[variable],
					solution.scenario_name,
					selectedCarrier!
				);
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
			.filterDataByIndex(selectedYears.map((year) => years.indexOf(Number(year))))
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
			selectedTechnologyType == null ||
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

	//#endregion
</script>

<DiagramPage parentTitle="The Transition Pathway" pageTitle="Capacity">
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<MultiSolutionFilter
				bind:solutions={selectedSolutions}
				bind:years
				bind:loading={solutionLoading}
				onSelected={onSolutionChanged}
				disabled={fetching || solutionLoading}
			></MultiSolutionFilter>
		</FilterSection>
		{#if !solutionLoading && !hasSomeUnsetSolutions}
			<FilterSection title="Carrier Selection">
				<Dropdown
					label="Carrier"
					options={carriers}
					bind:value={selectedCarrier}
					disabled={fetching || solutionLoading}
					onUpdate={onCarrierChanged}
				></Dropdown>
			</FilterSection>
			{#if selectedCarrier !== null}
				<FilterSection title="Variable Selection">
					<Dropdown
						label="Variable"
						options={variables}
						bind:value={selectedVariable}
						disabled={fetching || solutionLoading}
						onUpdate={onVariableChanged}
					></Dropdown>
					<Dropdown
						label="Technology Type"
						options={technologyTypes}
						bind:value={selectedTechnologyType}
						disabled={fetching || solutionLoading}
						onUpdate={onTechnologyTypeChanged}
					></Dropdown>
					{#if selectedTechnologyType == 'storage'}
						<Radio
							label="Storage Type"
							options={storageTypeOptions}
							bind:value={selectedStorageType}
							onUpdate={onTechnologyTypeChanged}
							disabled={fetching || solutionLoading}
						></Radio>
					{/if}
				</FilterSection>
			{/if}
			{#if selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<Radio label="Aggregation" options={aggregationOptions} bind:value={selectedAggregation}
					></Radio>
					<ToggleButton label="Normalization" bind:value={selectedNormalization}></ToggleButton>
					{#if selectedAggregation == 'technology'}
						<MultiSelect
							label="Technologies"
							bind:value={selectedTechnologies}
							options={technologies}
						></MultiSelect>
					{:else}
						<MultiSelect label="Nodes" bind:value={selectedLocations} options={locations}
						></MultiSelect>
					{/if}
					<MultiSelect
						label="Years"
						bind:value={selectedYears}
						options={years.map((y) => y.toString())}
					></MultiSelect>
				</FilterSection>
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
			<WarningMessage message="Please select a solution"></WarningMessage>
		{:else if carriers.length == 0}
			<ErrorMessage message="No carriers for this solution found"></ErrorMessage>
		{:else if selectedCarrier === null}
			<WarningMessage message="Please select a carrier"></WarningMessage>
		{:else if technologies.length == 0}
			<ErrorMessage message="No technologies for this selection found"></ErrorMessage>
		{:else if locations.length == 0}
			<ErrorMessage message="No locations for this selection found"></ErrorMessage>
		{:else if datasets.length == 0}
			<ErrorMessage message="No data for this selection found"></ErrorMessage>
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
				bind:this={chart}
			></Chart>
		{/if}
	{/snippet}
</DiagramPage>
