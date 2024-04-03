<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import ComponentBarChart from "./ComponentBarChart.svelte";
	import type { ActivatedSolution } from "$lib/types";

	let data: Papa.ParseResult<any>;
	let carriers: string[] = [];
	let selected_carrier: string | null = null;
	let nodes: string[] = [];
	let years: number[] = [];
	let technologies: string[] = [];
	let carbon_emissions: boolean = false;

	let selected_solution: ActivatedSolution | null = null;
	let selected_technology_type: string | null = null;
	let selected_node: string | null = null;
	let selected_year: string | null = null;
	let selected_technology: string | null = null;
	let selected_variable: string | null = null;

	function reset_form() {
		selected_solution = null;
		selected_technology_type = null;
		selected_node = null;
		selected_year = null;
		selected_technology = null;
		selected_node = null;
		selected_variable = null;
	}
	function activate_solution(
		solution_object: CustomEvent<ActivatedSolution | null>,
	) {
		selected_solution = solution_object.detail;
		selected_technology_type = null;

		if (selected_solution == null) {
			return;
		}

		carriers = selected_solution.detail.system.set_carriers;
		nodes = selected_solution.detail.system.set_nodes;
		let years_index = [
			...Array(selected_solution.detail.system.optimized_years).keys(),
		];
		years = years_index.map(
			(i) => i + selected_solution!.detail.system.reference_year,
		);
		update_lists();
	}

	function update_lists() {
		technologies = selected_solution!.detail.system.set_technologies;
		carriers = selected_solution!.detail.system.set_carriers;
	}
</script>

<h2>Costs</h2>
<SolutionFilter on:solution_selected={activate_solution} />

{#if technologies.length > 0}
	<div class="row">
		<div class="col">
			<h3>Technology (Capex)</h3>
			<AllCheckbox bind:elements={technologies}></AllCheckbox>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<h3>Technology (Opex)</h3>
			<AllCheckbox bind:elements={technologies}></AllCheckbox>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<h3>Carriers</h3>
			<AllCheckbox bind:elements={technologies}></AllCheckbox>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<h3>Shed demand</h3>
			<AllCheckbox bind:elements={technologies}></AllCheckbox>
		</div>
	</div>
	<div class="row">
		<div class="col">
			<h3>Carbon Emissions</h3>
			<input
				type="checkbox"
				class="btn-check"
				id="btn-check-outlined"
				autocomplete="off"
				bind:checked={carbon_emissions}
			/>
			<label class="btn btn-outline-primary" for="btn-check-outlined"
				>{carbon_emissions ? "on" : "off"}</label
			><br />
		</div>
	</div>
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
{:else if selected_technology_type != null && selected_carrier != null}
	<div class="row">
		<div class="col">
			<h4>
				No technologies for the selected technology type and carrier.
			</h4>
		</div>
	</div>
{/if}

<ComponentBarChart bind:component_data={data} on:change={reset_form} />
