<script lang="ts">
	import type { Solution, SolutionDetail, ActivatedSolution } from '$lib/types';
	import { get_solutions, get_solution_detail } from '$lib/temple';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	interface Props {
		carriers?: string[];
		nodes?: string[];
		edges?: string[];
		years?: number[];
		selected_solution: ActivatedSolution | null;
		loading?: boolean;
		enabled?: boolean;
		solution_selected: (selected_solution: ActivatedSolution | null) => void;
	}

	let {
		carriers = $bindable([]),
		nodes = $bindable([]),
		edges = $bindable([]),
		years = $bindable([]),
		selected_solution = $bindable(),
		loading = $bindable(false),
		enabled = true,
		solution_selected
	}: Props = $props();

	let solutionList: Array<Solution> = $state([]);
	let solutionDetail: SolutionDetail | null = $state(null);

	let activeFirstLevel: string = $state('');
	let activeSecondLevel: string = $state('');
	let activeScenario: string = $state('');

	let firstLevels: string[] = $derived(
		Array.from(new Set(solutionList.map((solution) => solution.name.split('.')[0])))
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

		activeFirstLevel = page.url.searchParams.get('solution')?.split('.')[0] || '';
		activeSecondLevel = page.url.searchParams.get('solution')?.split('.')[1] || '';
		activeScenario = page.url.searchParams.get('scenario') || '';
		update_solution_details();
	});

	function first_level_changed() {
		activeSecondLevel = '';
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
			detail: solutionDetail!.scenarios[activeScenario],
			components: solutionDetail.components,
			version: solutionDetail.version
		};

		replaceState(
			`?solution=${selected_solution.solution_name}&scenario=${selected_solution.scenario_name}`,
			{
				solution_name: selected_solution.solution_name,
				scenario_name: selected_solution.scenario_name
			}
		);

		carriers = selected_solution.detail.system.set_carriers.slice();
		nodes = selected_solution.detail.system.set_nodes;
		edges = Object.keys(selected_solution.detail.edges);
		years = [...Array(selected_solution.detail.system.optimized_years).keys()].map(
			(i) =>
				i * selected_solution!.detail.system.interval_between_years +
				selected_solution!.detail.system.reference_year
		);

		solution_selected(selected_solution);
	}
</script>

<div class="row align-items-end">
	<div class="col-4">
		<h3>Solution</h3>
		<select
			class="form-select"
			bind:value={activeFirstLevel}
			disabled={!enabled}
			onchange={first_level_changed}
		>
			{#each firstLevels as solution}
				<option value={solution}>
					{solution}
				</option>
			{/each}
		</select>
	</div>
	{#if secondLevels.length > 0}
		<div class="col-4">
			<h3>Subsolution</h3>
			<select
				class="form-select"
				bind:value={activeSecondLevel}
				disabled={!enabled}
				onchange={second_level_changed}
			>
				{#each secondLevels as solution}
					<option value={solution}>
						{solution}
					</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if solutionDetail && Object.keys(solutionDetail.scenarios).length > 1}
		<div class="col-4">
			<h3>Scenario</h3>
			<select
				class="form-select"
				bind:value={activeScenario}
				disabled={!enabled}
				onchange={dispatch_event}
			>
				{#each Object.keys(solutionDetail.scenarios) as scenario}
					<option value={scenario}>
						{scenario}
					</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
