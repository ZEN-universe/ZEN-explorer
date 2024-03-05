<script lang="ts">
	import type {
		Solution,
		Component,
		SolutionDetail,
		ActivatedSolution,
		ScenarioDetail
	} from '$lib/types';
	import { onMount, tick, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ solution_selected: ActivatedSolution | null }>();
	let solution_list: Array<Solution> = [];
	let components: Array<Component> = [];
	let active_solution: string;
	let active_component: string = '';
	let active_scenario: string;
	let solution_detail: SolutionDetail | null = null;
	let active_scenario_detail: ScenarioDetail | null = null;

	onMount(async function () {
		console.log('Updating solution');
		solution_list = await (await fetch('http://localhost:8000/solutions/list')).json();
	});

	async function update_components() {
		if (!active_solution) {
			return;
		}

		components = await (
			await fetch(`http://localhost:8000/solutions/${active_solution}/components`)
		).json();

		components = components.filter((c) =>
			['capacity', 'capacity_addition'].includes(c.component_name)
		);

		await tick();

		active_component = '';
	}

	async function update_solution_details() {
		const response = await fetch(`http://localhost:8000/solutions/get_detail/${active_solution}`);
		solution_detail = await response.json();
		active_scenario = '';
		active_component = '';

		dispatch('solution_selected', null);
	}

	async function dispatch_solution() {
		if (solution_detail == null) {
			return;
		}
		active_scenario_detail = solution_detail!.scenarios[active_scenario];

		let activated_solution: ActivatedSolution = {
			solution_name: active_solution,
			scenario_name: active_scenario,
			component_name: active_component,
			detail: active_scenario_detail
		};

		dispatch('solution_selected', activated_solution);
	}
</script>

<div class="row">
	<div class="col">
		<h3>Solution</h3>
		<select bind:value={active_solution} on:change={() => update_solution_details()}>
			{#each solution_list as solution}
				<option value={solution.name}>
					{solution.name}
				</option>
			{/each}
		</select>
	</div>
</div>

{#if solution_detail != null}
	<div class="row">
		<div class="col">
			<h3>Scenario</h3>
			<select bind:value={active_scenario} on:change={() => update_components()}>
				{#each Object.keys(solution_detail.scenarios) as scenario}
					<option value={scenario}>
						{scenario}
					</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="row">
		<div class="col">
			<h3>Variable</h3>
			<select bind:value={active_component} on:change={() => dispatch_solution()}>
				{#each components as component}
					<option value={component.component_name}>
						{component.component_name}
					</option>
				{/each}
			</select>
		</div>
	</div>
{/if}
