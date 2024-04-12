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
	let solution_list: Array<Solution> = [];
	let active_solution: string;
	let active_scenario: string;
	let solution_detail: SolutionDetail | null = null;
	let active_scenario_detail: ScenarioDetail | null = null;

	onMount(async function () {
		solution_list = await get_solutions();
	});

	async function update_solution_details() {
		solution_detail = await get_solution_detail(active_solution);
		if (Object.keys(solution_detail.scenarios).length == 1) {
			active_scenario = Object.keys(solution_detail.scenarios)[0];
			dispatch_solution();
		} else {
			active_scenario = "";
			dispatch("solution_selected", null);
		}
	}

	async function dispatch_solution() {
		if (solution_detail == null) {
			return;
		}
		active_scenario_detail = solution_detail!.scenarios[active_scenario];

		let activated_solution: ActivatedSolution = {
			solution_name: active_solution,
			scenario_name: active_scenario,
			detail: active_scenario_detail,
		};

		dispatch("solution_selected", activated_solution);
	}
</script>

<div class="row">
	<div class="col">
		<h3>Solution</h3>
		<select
			bind:value={active_solution}
			on:change={() => update_solution_details()}
		>
			{#each solution_list as solution}
				<option value={solution.name}>
					{solution.name}
				</option>
			{/each}
		</select>
	</div>
</div>

{#if solution_detail != null && Object.keys(solution_detail.scenarios).length > 1}
	<div class="row">
		<div class="col">
			<h3>Scenario</h3>
			<select
				bind:value={active_scenario}
				on:change={() => dispatch_solution()}
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
