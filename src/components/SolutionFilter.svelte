<script lang="ts">
	import type { Solution, SolutionDetail, ActivatedSolution } from '$lib/types';
	import { get_solutions, get_solution_detail } from '$lib/temple';
	import { onMount } from 'svelte';
	import { get_url_param, update_url_params } from '$lib/url_params.svelte';
	import { remove_duplicates } from '$lib/utils';
	import FilterRow from './FilterRow.svelte';

	interface Props {
		carriers?: string[];
		nodes?: string[];
		edges?: string[];
		years?: number[];
		selected_solution: ActivatedSolution | null;
		loading?: boolean;
		disabled?: boolean;
		solution_selected?: (selected_solution: ActivatedSolution | null) => void;
	}

	let {
		carriers = $bindable([]),
		nodes = $bindable([]),
		edges = $bindable([]),
		years = $bindable([]),
		selected_solution = $bindable(),
		loading = $bindable(false),
		disabled = true,
		solution_selected
	}: Props = $props();

	let solutionList: Array<Solution> = $state([]);
	let solutionDetail: SolutionDetail | null = $state(null);

	let activeFirstLevel: string = $state('');
	let activeSecondLevel: string = $state('');
	let activeScenario: string = $state('');

	let firstLevels: string[] = $derived(
		remove_duplicates(solutionList.map((solution) => solution.name.split('.')[0]))
	);
	let secondLevels: string[] = $derived(
		solutionList
			.filter((solution) => solution.name.startsWith(activeFirstLevel))
			.map((solution) => solution.name.split('.')[1] || null)
			.filter((solution) => solution != null)
	);
	let activeSolutionName: string | null = $derived.by(() => {
		if (secondLevels.length == 0) {
			return activeFirstLevel || null;
		} else {
			return activeSecondLevel ? activeFirstLevel + '.' + activeSecondLevel : null;
		}
	});

	onMount(async function () {
		solutionList = await get_solutions();

		activeFirstLevel = get_url_param('solution')?.split('.')[0] || '';
		activeSecondLevel = get_url_param('solution')?.split('.')[1] || '';
		activeScenario = get_url_param('scenario') || '';
		update_solution_details();
	});

	function first_level_changed() {
		activeSecondLevel = '';
		activeScenario = '';
		solutionDetail = null;
		update_solution_details();
	}

	function second_level_changed() {
		activeScenario = '';
		update_solution_details();
	}

	async function update_solution_details() {
		if (activeSolutionName == null) {
			selected_solution = null;
			return;
		}

		loading = true;
		solutionDetail = await get_solution_detail(activeSolutionName);

		if (Object.keys(solutionDetail.scenarios).length == 1) {
			activeScenario = Object.keys(solutionDetail.scenarios)[0];
			dispatch_event();
		} else if (activeScenario != '' && activeScenario in solutionDetail.scenarios) {
			dispatch_event();
		} else {
			selected_solution = null;
		}

		loading = false;
	}

	function dispatch_event() {
		if (solutionDetail == null || activeSolutionName == null) {
			return;
		}

		selected_solution = {
			solution_name: activeSolutionName,
			scenario_name: activeScenario,
			detail: solutionDetail.scenarios[activeScenario],
			components: solutionDetail.components,
			version: solutionDetail.version
		};

		update_url_params({
			solution: selected_solution.solution_name,
			scenario:
				Object.keys(solutionDetail.scenarios).length > 1 ? selected_solution.scenario_name : null
		});

		carriers = selected_solution.detail.system.set_carriers.slice();
		nodes = selected_solution.detail.system.set_nodes;
		edges = Object.keys(selected_solution.detail.edges);
		years = [...Array(selected_solution.detail.system.optimized_years).keys()].map(
			(i) =>
				i * selected_solution!.detail.system.interval_between_years +
				selected_solution!.detail.system.reference_year
		);

		solution_selected?.(selected_solution);
	}
</script>

<FilterRow label="Solution">
	{#snippet content(id)}
		<select
			{id}
			class="form-select"
			bind:value={activeFirstLevel}
			{disabled}
			onchange={first_level_changed}
		>
			{#each firstLevels as solution}
				<option value={solution}>
					{solution}
				</option>
			{/each}
		</select>
	{/snippet}
</FilterRow>
{#if secondLevels.length > 0}
	<FilterRow label="Subsolution">
		{#snippet content(id)}
			<select
				{id}
				class="form-select"
				bind:value={activeSecondLevel}
				{disabled}
				onchange={second_level_changed}
			>
				{#each secondLevels as solution}
					<option value={solution}>
						{solution}
					</option>
				{/each}
			</select>
		{/snippet}
	</FilterRow>
{/if}

{#if solutionDetail && Object.keys(solutionDetail.scenarios).length > 1}
	<FilterRow label="Secnario">
		{#snippet content(id)}
			<select
				{id}
				class="form-select"
				bind:value={activeScenario}
				{disabled}
				onchange={dispatch_event}
			>
				{#each Object.keys(solutionDetail?.scenarios || []) as scenario}
					<option value={scenario}>
						{scenario}
					</option>
				{/each}
			</select>
		{/snippet}
	</FilterRow>
{/if}
