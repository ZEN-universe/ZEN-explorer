<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";

	let data: Papa.ParseResult<any>;
	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let variables: string[] = ["Annual", "Cumulative"];

	let selected_solution: ActivatedSolution | null = null;
	let selected_node: string | null = null;
	let selected_year: string | null = null;
	let selected_variable: string | null = null;
	let subdivision: boolean = false;
	let selected_carrier: string | null = null;
	let technologies: string[] = [];
	let selected_technology: string | null = null;

	function reset_form() {
		selected_solution = null;
		selected_node = null;
		selected_year = null;
		selected_node = null;
		selected_carrier = null;
	}

	function activate_solution(
		solution_object: CustomEvent<ActivatedSolution | null>,
	) {
		selected_solution = solution_object.detail;

		if (selected_solution == null) {
			return;
		}

		carriers = selected_solution.detail.system.set_carriers;
		technologies = selected_solution?.detail.system.set_technologies ?? [];
		nodes = selected_solution.detail.system.set_nodes;
		let years_index = [
			...Array(selected_solution.detail.system.optimized_years).keys(),
		];
		years = years_index.map(
			(i) => i + selected_solution!.detail.system.reference_year,
		);
	}
</script>

<h2>Emissions</h2>
<SolutionFilter on:solution_selected={activate_solution} />

{#if selected_solution != null}
	<div class="row">
		<div class="col">
			<h3>Subdivision</h3>
			<input
				type="checkbox"
				class="btn-check"
				id="btn-check-outlined"
				autocomplete="off"
				bind:checked={subdivision}
				on:change={() => {
					selected_variable = null;
				}}
			/>
			<label class="btn btn-outline-primary" for="btn-check-outlined"
				>{subdivision ? "on" : "off"}</label
			><br />
		</div>
	</div>
	{#if !subdivision}
		<div class="row">
			<div class="col">
				<h3>Variable</h3>
				<select bind:value={selected_variable}>
					{#each variables as variable}
						<option value={variable}>
							{variable}
						</option>
					{/each}
				</select>
			</div>
		</div>
	{:else}
		<div class="row">
			<div class="col">
				<h3>Carrier</h3>
				<AllCheckbox bind:elements={carriers}></AllCheckbox>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<h3>Technology</h3>
				<AllCheckbox bind:elements={technologies}></AllCheckbox>
			</div>
		</div>
	{/if}
	{#if subdivision || selected_variable != null}
		<div class="row">
			<div class="col">
				<h3>Node</h3>
				<AllCheckbox bind:elements={nodes}></AllCheckbox>
			</div>
		</div>
		<div class="row">
			<div class="col">
				<h3>Year</h3>
				<AllCheckbox bind:elements={years}></AllCheckbox>
			</div>
		</div>
	{/if}
{/if}