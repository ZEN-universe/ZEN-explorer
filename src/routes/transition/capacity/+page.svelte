<script lang="ts">
	import type { ChartOptions, ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
	import { untrack } from 'svelte';

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
	import Spinner from '$components/Spinner.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import WarningMessage from '$components/WarningMessage.svelte';

	import { fetchTotal } from '$lib/temple';
	import {
		generateLabelsForSolutionComparison,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { removeDuplicates } from '$lib/utils';
	import Entries from '@/lib/entries';

	import type { Variable, TechnologyType, StorageType, AggregationOption } from './processData';
	import { computeDatasets } from './processData';

	// ======================================
	// State variables
	// ======================================

	let fetchedEntries: Entries[] = $state([]);

	const variables: Variable[] = ['capacity', 'capacity_addition'];
	const variableLabels: Record<Variable, string> = {
		capacity: 'Capacity',
		capacity_addition: 'Capacity Addition'
	};
	const technologyTypes: TechnologyType[] = ['conversion', 'storage', 'transport'];
	const storageTypeOptions: StorageType[] = ['energy', 'power'];
	const aggregationOptions: { label: string; value: AggregationOption }[] = [
		{ label: 'Node', value: 'node' },
		{ label: 'Technology', value: 'technology' }
	];
	let years: number[] = $state([]);

	let selectedSolutions: (ActivatedSolution | null)[] = $state([null]);
	let selectedVariable: Variable = $state('capacity');
	let selectedTechnologyType: TechnologyType = $state('conversion');
	let selectedStorageType: StorageType = $state('energy');
	let selectedCarrier: string | null = $state(null);
	let selectedAggregation: AggregationOption = $state('technology');
	let selectedNormalization: boolean = $state(false);
	let selectedLocations: string[] = $state([]);
	let selectedTechnologies: string[] = $state([]);
	let selectedYears: string[] = $state([]);

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let hasSomeUnsetSolutions: boolean = $derived(selectedSolutions.some((s) => s === null));

	let units: { [carrier: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacity_type = selectedTechnologyType == 'storage' ? selectedStorageType : 'power';
		return units[technologies[0] + '_' + capacity_type] || '';
	});

	let chart = $state<Chart<'bar'>>();

	// ======================================
	// Plot configuration
	// ======================================

	let labels: string[] = $derived(selectedYears.map((year) => year.toString()));
	function getPlotOptions(): ChartOptions<'bar'> {
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
						text:
							`${variableLabels[selectedVariable]}` + (selectedNormalization ? '' : ` [${unit}]`)
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
		};
	}

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

	// ======================================
	// Filter options
	// ======================================

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

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
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

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setLocations: Set<string> = new Set();
		fetchedEntries.forEach((items) => {
			items.forEach(({ index: { technology, location } }) => {
				if (technologies.includes(technology)) {
					setLocations.add(location);
				}
			});
		});
		return Array.from(setLocations).sort();
	});

	// ======================================
	// Filter effects
	// ======================================

	$effect(() => {
		// Update the selected technologies whenever the technologies array changes
		selectedTechnologies = technologies;
	});

	$effect(() => {
		// Update the selected locations whenever the locations array changes
		selectedLocations = locations;
	});

	$effect(() => {
		// Whenever the selected solutions, variable, or technology type changes, reset the data selection and fetch new data
		selectedSolutions;
		selectedVariable;
		selectedTechnologyType;
		selectedStorageType;
		selectedCarrier;
		untrack(() => {
			selectedAggregation = 'node';
			selectedNormalization = false;
			selectedLocations = locations;
			selectedTechnologies = technologies;
			selectedYears = years.map((y) => y.toString());
			fetchData();
		});
	});

	// ======================================
	// Data fetching
	// ======================================

	/**
	 * Fetch data from the API of the selected values in the form
	 */
	async function fetchData() {
		if (selectedCarrier === null || hasSomeUnsetSolutions) {
			return;
		}

		fetching = true;

		const solutions = selectedSolutions as ActivatedSolution[];
		const response = await Promise.all(
			solutions.map((solution) => {
				return fetchTotal(
					solution.solution_name,
					[selectedVariable],
					solution.scenario_name,
					selectedCarrier!
				);
			})
		);

		fetchedEntries = response.map((res) => Entries.fromRows(res[selectedVariable]?.data ?? []));

		if (response[0]?.unit?.data) {
			units = Object.fromEntries(
				response[0].unit.data.map((u) => [u.technology + '_' + u.capacity_type, u[0] || u.units])
			);
		}

		fetching = false;
	}

	// ======================================
	// Data processing
	// ======================================

	let [datasets, patterns]: [ChartDataset<'bar'>[], ColorBoxItem[]] = $derived.by(() =>
		computeDatasets(
			fetchedEntries,
			locations,
			technologies,
			years,
			selectedSolutions,
			selectedYears,
			selectedTechnologies,
			selectedLocations,
			selectedTechnologyType,
			selectedStorageType,
			selectedAggregation,
			selectedNormalization
		)
	);
</script>

<DiagramPage
	parentTitle="The Transition Pathway"
	pageTitle="Capacity"
	subtitle="Annual capacity and capacity addition"
>
	{#snippet filters()}
		<FilterSection title="Solution Selection">
			<MultiSolutionFilter
				bind:solutions={selectedSolutions}
				bind:years
				bind:loading={solutionLoading}
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
					urlParam="car"
					unsetIfInvalid
					default={carriers.length > 0 ? carriers[0] : null}
				>
					{#snippet helpText()}
						Select the energy carrier for which to view results. Only capacities of technologies
						which have the selected carrier as the reference carrier are shown.
					{/snippet}
				</Dropdown>
			</FilterSection>
			{#if selectedCarrier !== null}
				<FilterSection title="Variable Selection">
					<Radio
						label="Variable"
						options={variables}
						bind:value={selectedVariable}
						disabled={fetching || solutionLoading}
						urlParam="var"
						unsetIfInvalid
					>
						{#snippet helpText()}
							<div>
								Select the variable which to shown on the plot:
								<ul class="ml-4 list-outside list-disc">
									<li>
										The variable "capacity" shows the total capacity in a given year and consists of
										the sum of existing capacities, previously installed capacities, and new
										capacity additions.
									</li>
									<li>
										The variable "capacity_addition" shows only the capacity which is newly
										installed in the system in the given year.
									</li>
								</ul>
							</div>
						{/snippet}
					</Radio>
					<Radio
						label="Technology Type"
						options={technologyTypes}
						bind:value={selectedTechnologyType}
						disabled={fetching || solutionLoading}
						urlParam="tech"
						unsetIfInvalid
					>
						{#snippet helpText()}
							Select whether to show capacities for conversion, storage, or transport technologies.
						{/snippet}
					</Radio>
					{#if selectedTechnologyType == 'storage'}
						<Radio
							label="Storage Type"
							options={storageTypeOptions}
							bind:value={selectedStorageType}
							disabled={fetching || solutionLoading}
							urlParam="stor"
							unsetIfInvalid
						></Radio>
					{/if}
				</FilterSection>
			{/if}
			{#if selectedCarrier !== null}
				<FilterSection title="Data Selection">
					<Radio label="Aggregation" options={aggregationOptions} bind:value={selectedAggregation}>
						{#snippet helpText()}
							Aggregate capacities belonging to the same node or technology.
							<ul class="ml-4 list-outside list-disc">
								<li>
									Choosing "Node" will show the capacity allocations per technology for each node
									(selected in the "Nodes" filter below).
								</li>
								<li>
									Choosing "Technology" will show the capacity allocations per node for each
									technology (selected in the "Technologies" filter below).
								</li>
							</ul>
						{/snippet}
					</Radio>
					<ToggleButton label="Normalization" bind:value={selectedNormalization}>
						{#snippet helpText()}
							Normalize the bars to have a height of one.
						{/snippet}
					</ToggleButton>
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
		<ChartButtons charts={[chart as Chart]} downloadable></ChartButtons>
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
				{labels}
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
