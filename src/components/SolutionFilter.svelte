<script lang="ts">
	import type { Solution, SolutionDetail, ActivatedSolution, ScenarioDetail } from '$lib/types';
	import { get_solutions, get_solution_detail } from '$lib/temple';

	import { onMount } from 'svelte';

	interface Levels {
		[key: string]: string[];
	}

	let solution_list: Array<Solution> = [];
	let levels: Levels = $state({});
	let active_scenario: string = $state('');
	let solution_detail: SolutionDetail | undefined = $state(undefined);
	let active_scenario_detail: ScenarioDetail | null = null;
	let solution_names: string[][] = [];
	let active_first_level: string = $state('');
	let active_solution_name: string;
	let active_second_level: string | null = $state(null);
	let second_levels: string[] = $state([]);

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
		solution_selected,
	}: Props = $props();

	onMount(async function () {
		solution_list = await get_solutions();
		solution_names = [];
		for (const solution of solution_list) {
			let current_names = solution.name.split('.');
			solution_names.push(current_names);
			if (!(current_names[0] in levels)) {
				levels[current_names[0]] = [];
			}

			if (current_names.length > 1) {
				levels[current_names[0]].push(current_names[1]);
			}
		}
	});
	function first_level_changed() {
		second_levels = levels[active_first_level];
		active_second_level = null;
		if (second_levels.length == 0) {
			active_solution_name = active_first_level;
			update_solution_details();
		}
	}

	function second_level_changed() {
		active_solution_name = active_first_level + '.' + active_second_level;
		update_solution_details();
	}

	async function update_solution_details() {
		loading = true;

		solution_detail = await get_solution_detail(active_solution_name);

		if (Object.keys(solution_detail!.scenarios).length == 1) {
			active_scenario = Object.keys(solution_detail!.scenarios)[0];
			dispatch_solution();
		} else {
			selected_solution = null;
			active_scenario = '';
			solution_selected(null);
		}
		loading = false;
	}

	async function dispatch_solution() {
		if (solution_detail == null) {
			return;
		}
		active_scenario_detail = solution_detail!.scenarios[active_scenario];

		let activated_solution: ActivatedSolution = {
			solution_name: active_solution_name,
			scenario_name: active_scenario,
			detail: active_scenario_detail,
			components: solution_detail.components,
			version: solution_detail.version
		};

		selected_solution = activated_solution;

		if (selected_solution == null) {
			return;
		}

		carriers = selected_solution.detail.system.set_carriers.slice();
		nodes = selected_solution.detail.system.set_nodes;
		edges = Object.keys(selected_solution.detail.edges);
		let years_index = [...Array(selected_solution.detail.system.optimized_years).keys()];
		years = years_index.map(
			(i) =>
				i * selected_solution!.detail.system.interval_between_years +
				selected_solution!.detail.system.reference_year
		);

		solution_selected(activated_solution);
	}
</script>

<div class="row align-items-end">
	<div class="col-4">
		<h3>Solution</h3>
		<select
			class="form-select"
			 bind:value={active_first_level} 
			disabled={!enabled}
			onchange={first_level_changed}
		>
			{#each Object.keys(levels) as solution}
				<option value={solution}>
					{solution}
				</option>
			{/each}
		</select>
	</div>
	{#if second_levels.length > 0}
	<div class="col-4">
		<h3>Subsolution</h3>
		<select
			class="form-select"
			bind:value={active_second_level}
			disabled={!enabled}
			onchange={second_level_changed}
		>
			{#each second_levels as solution}
			<option value={solution}>
				{solution}
			</option>
			{/each}
		</select>
	</div>
	{/if}

	{#if solution_detail != null && Object.keys(solution_detail.scenarios).length > 1}
		<div class="col-4">
			<h3>Scenario</h3>
			<select
				class="form-select"
				bind:value={active_scenario}
				disabled={!enabled}
				onchange={dispatch_solution}
			>
				{#each Object.keys(solution_detail.scenarios) as scenario}
					<option value={scenario}>
						{scenario}
					</option>
				{/each}
			</select>
		</div>
	{/if}
</div>