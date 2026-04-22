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
	import type { ContextMenuItem } from '$components/ContextMenu.svelte';

	import { fetchTotal } from '$lib/temple';
	import {
		findSolutionBySuffix,
		generateLabelsForSolutionComparison,
		generateSolutionSuffix,
		onClickLegendForSolutionComparison,
		resetLegendStateForSolutionComparison
	} from '$lib/compareSolutions.svelte';
	import type { ActivatedSolution } from '$lib/types';
	import { removeDuplicates } from '$lib/utils';
	import Entries from '@/lib/entries';
	import { addParametersToPath, QUERY_PARAM_KEYS, useURLParams } from '@/lib/queryParams.svelte';

	import type {
		Variable,
		TechnologyType,
		StorageType,
		AggregationOption,
		Data,
		Selection
	} from './processData';
	import { computeDatasets } from './processData';

	useURLParams();

	// ======================================
	// State variables
	// ======================================

	let data: Data = $state({
		capacity: [],
		capacity_addition: [],
		capacity_previous: []
	});

	const variables: { value: Variable; label: string }[] = [
		{ value: 'capacity', label: 'Capacity' },
		{ value: 'capacity_addition', label: 'Capacity addition and retirement' }
	];
	const variableLabels: Record<Variable, string> = {
		capacity: 'Capacity',
		capacity_addition: 'Capacity addition and retirement'
	};
	const technologyTypes: TechnologyType[] = ['conversion', 'storage', 'transport'];
	const storageTypeOptions: StorageType[] = ['energy', 'power'];
	const aggregationOptions: { label: string; value: AggregationOption }[] = [
		{ label: 'Node', value: 'node' },
		{ label: 'Technology', value: 'technology' }
	];
	let years: number[] = $state([]);

	let selection: Selection = $state({
		solutions: [null],
		variable: 'capacity',
		technologyType: 'conversion',
		storageType: 'energy',
		carrier: null,
		aggregation: 'technology',
		normalization: false,
		locations: [],
		technologies: [],
		years: []
	});

	let solutionLoading: boolean = $state(false);
	let fetching: boolean = $state(false);

	let hasSomeUnsetSolutions: boolean = $derived(selection.solutions.some((s) => s === null));

	let units: { [carrier: string]: string } = $state({});
	let unit: string = $derived.by(() => {
		const capacity_type = selection.technologyType == 'storage' ? selection.storageType : 'power';
		return units[technologies[0] + '_' + capacity_type] || '';
	});

	let chart = $state<Chart<'bar'>>();

	// ======================================
	// Plot configuration
	// ======================================

	let labels: string[] = $derived(selection.years.map((year) => year.toString()));
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
							`${variableLabels[selection.variable]}` +
							(selection.normalization ? '' : ` [${unit}]`)
					},
					min: selection.normalization ? (selection.variable === 'capacity' ? 0 : -1) : undefined,
					max: selection.normalization ? 1 : undefined
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
					(selection.normalization ? '' : ` ${unit}`),
				title: (items: TooltipItem<keyof ChartTypeRegistry>[]) => {
					if (items.length > 0) {
						return `${items[0].label} - ${items[0].dataset.stack}`;
					}
				}
			}
		}
	};

	let plotName: string = $derived.by(() => {
		if (selection.solutions[0] == null) {
			return '';
		}
		return [
			selection.solutions[0].solution_name.split('.').pop(),
			selection.solutions[0].scenario_name,
			selection.variable,
			selection.technologyType,
			selection.carrier
		].join('_');
	});

	// ======================================
	// Filter options
	// ======================================

	let technologiesPerSolution = $derived.by(() => {
		if (hasSomeUnsetSolutions || selection.technologyType === null) {
			return [];
		}

		const key = {
			conversion: 'set_conversion_technologies',
			storage: 'set_storage_technologies',
			transport: 'set_transport_technologies'
		}[selection.technologyType] as
			| 'set_conversion_technologies'
			| 'set_storage_technologies'
			| 'set_transport_technologies';

		return (selection.solutions as ActivatedSolution[]).map((solution) => {
			return solution.detail.system[key] || [];
		});
	});

	let carriers: string[] = $derived.by(() => {
		if (hasSomeUnsetSolutions) {
			return [];
		}

		return removeDuplicates(
			selection.solutions.flatMap((solution) => Object.values(solution!.detail.reference_carrier))
		).sort();
	});

	let technologies: string[] = $derived.by(() => {
		if (selection.technologyType === null || selection.carrier === null || hasSomeUnsetSolutions) {
			return [];
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const setTechnologies: Set<string> = new Set();
		(selection.solutions as ActivatedSolution[]).forEach((solution, solutionIndex) => {
			(technologiesPerSolution[solutionIndex] ?? []).forEach((tech) => {
				if (solution.detail.reference_carrier[tech] === selection.carrier) {
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
		data.capacity.forEach((items) => {
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
		selection.technologies = technologies;
	});

	$effect(() => {
		// Update the selected locations whenever the locations array changes
		selection.locations = locations;
	});

	$effect(() => {
		// Whenever the selected solutions, variable, or technology type changes, reset the data selection and fetch new data
		selection.solutions;
		selection.variable;
		selection.technologyType;
		selection.storageType;
		selection.carrier;
		untrack(() => {
			selection.aggregation = 'node';
			selection.normalization = false;
			selection.locations = locations;
			selection.technologies = technologies;
			selection.years = years.map((y) => y.toString());
			fetchData();
		});
	});

	// ======================================
	// Context menu
	// ======================================

	function getContextMenuItems(year: string, datasetIndex: number): ContextMenuItem[] {
		const solution = findSolutionBySuffix(selection.solutions, datasets[datasetIndex].stack);
		if (!solution || !selection.carrier) return [];

		return [
			{
				label: `Go to The Transition Pathway - Production`,
				href: addParametersToPath('/explorer/transition/production', {
					[QUERY_PARAM_KEYS.solutions]:
						selection.solutions.map((s) => s?.solution_name).join('~') || null,
					[QUERY_PARAM_KEYS.scenarios]:
						selection.solutions.map((s) => s?.scenario_name).join('~') || null,
					[QUERY_PARAM_KEYS.carrier]: selection.carrier,
					[QUERY_PARAM_KEYS.activeYear]: year,
					[QUERY_PARAM_KEYS.activeSolution]: generateSolutionSuffix(solution)
				})
			},
			{
				label: `Go to The Map - Capacity`,
				href: addParametersToPath(`/explorer/map/capacity`, {
					[QUERY_PARAM_KEYS.solution]: solution.solution_name ?? null,
					[QUERY_PARAM_KEYS.scenario]: solution.scenario_name ?? null,
					[QUERY_PARAM_KEYS.carrier]: selection.carrier,
					[QUERY_PARAM_KEYS.year]: year
				})
			},
			{
				label: `Go to The Map - Production`,
				href: addParametersToPath(`/explorer/map/production`, {
					[QUERY_PARAM_KEYS.solution]: solution.solution_name ?? null,
					[QUERY_PARAM_KEYS.scenario]: solution.scenario_name ?? null,
					[QUERY_PARAM_KEYS.carrier]: selection.carrier,
					[QUERY_PARAM_KEYS.year]: year
				})
			}
		];
	}

	// ======================================
	// Data fetching
	// ======================================

	/**
	 * Fetch data from the API of the selected values in the form
	 */
	async function fetchData() {
		if (selection.carrier === null || hasSomeUnsetSolutions) {
			return;
		}

		fetching = true;

		const solutions = selection.solutions as ActivatedSolution[];
		const components: ('capacity' | 'capacity_addition' | 'capacity_previous')[] =
			selection.variable === 'capacity'
				? ['capacity']
				: ['capacity', 'capacity_addition', 'capacity_previous'];
		const response = await Promise.all(
			solutions.map((solution) => {
				return fetchTotal(
					solution.solution_name,
					components,
					solution.scenario_name,
					selection.carrier!
				);
			})
		);

		components.forEach((component) => {
			data[component] = response.map((res) => Entries.fromRows(res[component]?.data ?? []));
		});

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
		computeDatasets(data, locations, technologies, years, selection)
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
				bind:solutions={selection.solutions}
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
					bind:value={selection.carrier}
					disabled={fetching || solutionLoading}
					urlParam={QUERY_PARAM_KEYS.carrier}
					unsetIfInvalid
				>
					{#snippet helpText()}
						Select the energy carrier for which to view results. Only capacities of technologies
						which have the selected carrier as the reference carrier are shown.
					{/snippet}
				</Dropdown>
			</FilterSection>
			{#if selection.carrier !== null}
				<FilterSection title="Variable Selection">
					<Radio
						label="Variable"
						options={variables}
						bind:value={selection.variable}
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.capacityVariable}
						unsetIfInvalid
					>
						{#snippet helpText()}
							<div>
								Select the variable which to shown on the plot:
								<ul class="ml-4 list-outside list-disc">
									<li>
										The variable "Capacity" shows the total capacity in a given year and consists of
										the sum of existing capacities, previously installed capacities, and new
										capacity additions.
									</li>
									<li>
										The variable "Capacity addition and retirement" shows only the capacity which is
										newly installed or retired in the system in the given year.
									</li>
								</ul>
							</div>
						{/snippet}
					</Radio>
					<Radio
						label="Technology Type"
						options={technologyTypes}
						bind:value={selection.technologyType}
						disabled={fetching || solutionLoading}
						urlParam={QUERY_PARAM_KEYS.technologyType}
						unsetIfInvalid
					>
						{#snippet helpText()}
							Select whether to show capacities for conversion, storage, or transport technologies.
						{/snippet}
					</Radio>
					{#if selection.technologyType == 'storage'}
						<Radio
							label="Storage Type"
							options={storageTypeOptions}
							bind:value={selection.storageType}
							disabled={fetching || solutionLoading}
							urlParam={QUERY_PARAM_KEYS.storageType}
							unsetIfInvalid
						></Radio>
					{/if}
				</FilterSection>
			{/if}
			{#if selection.carrier !== null}
				<FilterSection title="Data Selection">
					<Radio
						label="Aggregation"
						options={aggregationOptions}
						bind:value={selection.aggregation}
					>
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
					<ToggleButton label="Normalization" bind:value={selection.normalization}>
						{#snippet helpText()}
							Normalize the bars to have a height of one.
						{/snippet}
					</ToggleButton>
					{#if selection.aggregation == 'technology'}
						<MultiSelect
							label="Technologies"
							bind:value={selection.technologies}
							options={technologies}
						></MultiSelect>
					{:else}
						<MultiSelect
							label={selection.technologyType !== 'transport' ? 'Nodes' : 'Edges'}
							bind:value={selection.locations}
							options={locations}
						></MultiSelect>
					{/if}
					<MultiSelect
						label="Years"
						bind:value={selection.years}
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
		{:else if selection.carrier === null}
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
				{getContextMenuItems}
				bind:this={chart}
			></Chart>
		{/if}
	{/snippet}
</DiagramPage>
