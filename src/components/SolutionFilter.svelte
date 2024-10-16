<script lang="ts">
	import type {
		Solution,
		SolutionDetail,
		ActivatedSolution,
		ScenarioDetail,
	} from "$lib/types";
	import { get_solutions, get_solution_detail } from "$lib/temple";

	import { onMount, tick, createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher<{
		solution_selected: ActivatedSolution | null;
	}>();

	interface Levels {
		[key: string]: string[];
	}

	let solution_list: Array<Solution> = [];
	let levels: Levels = {};
	let active_scenario: string;
	let solution_detail: SolutionDetail | null = null;
	let active_scenario_detail: ScenarioDetail | null = null;
	let solution_names: string[][] = [];
	let active_first_level: string;
	let active_solution_name: string;
	let active_second_level: string | null = null;
	let second_levels: string[] = [];

	export let carriers: string[] = [];
	export let nodes: string[] = [];
	export let edges: string[] = [];
	export let years: number[] = [];
	export let selected_solution: ActivatedSolution | null;
	export let loading: boolean = false;
	export let enabled: boolean = true;

	onMount(async function () {
		solution_list = await get_solutions();
		solution_names = [];
		for (const solution of solution_list) {
			let current_names = solution.name.split(".");
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
		active_solution_name = active_first_level + "." + active_second_level;
		update_solution_details();
	}

	async function update_solution_details() {
		loading = true;

		solution_detail = await get_solution_detail(active_solution_name);
		if (Object.keys(solution_detail.scenarios).length == 1) {
			active_scenario = Object.keys(solution_detail.scenarios)[0];
			dispatch_solution();
		} else {
			selected_solution = null;
			active_scenario = "";
			dispatch("solution_selected", null);
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
			version: solution_detail.version,
		};

		selected_solution = activated_solution;

		if (selected_solution == null) {
			return;
		}

		carriers = selected_solution.detail.system.set_carriers;
		nodes = selected_solution.detail.system.set_nodes;
		edges = Object.keys(selected_solution.detail.edges);
		let years_index = [
			...Array(selected_solution.detail.system.optimized_years).keys(),
		];
		years = years_index.map(
			(i) =>
				i * selected_solution!.detail.system.interval_between_years +
				selected_solution!.detail.system.reference_year,
		);

		dispatch("solution_selected", activated_solution);
	}
</script>

<div class="row">
	<div class="col">
		<h3>Solution</h3>
		<select
			bind:value={active_first_level}
			on:change={() => first_level_changed()}
			disabled={!enabled}
		>
			{#each Object.keys(levels) as solution}
				<option value={solution}>
					{solution}
				</option>
			{/each}
		</select>
		{#if second_levels.length > 0}
			<select
				bind:value={active_second_level}
				on:change={() => second_level_changed()}
				disabled={!enabled}
			>
				{#each second_levels as solution}
					<option value={solution}>
						{solution}
					</option>
				{/each}
			</select>
		{/if}
	</div>
</div>

{#if solution_detail != null && Object.keys(solution_detail.scenarios).length > 1}
	<div class="row">
		<div class="col">
			<h3>Scenario</h3>
			<select
				bind:value={active_scenario}
				on:change={() => dispatch_solution()}
				disabled={!enabled}
			>
				{#each Object.keys(solution_detail.scenarios) as scenario}
					<option value={scenario}>
						{scenario}
					</option>
				{/each}
			</select>
		</div>
	</div>
{/if}
