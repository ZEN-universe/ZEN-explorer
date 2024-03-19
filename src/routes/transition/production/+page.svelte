<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import ComponentBarChart from "./ComponentBarChart.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import { base } from "$app/paths";

	let data: Papa.ParseResult<any>;
	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let variables: { [key: string]: string[] | null } = {
		conversion: ["input", "output"],
		storage: ["charge", "discharge"],
		transport: null,
		import_export: ["import", "export"],
	};

	let selected_solution: ActivatedSolution | null = null;
	let selected_node: string | null = null;
	let selected_year: string | null = null;
	let selected_variable: string | null = null;
	let selected_subvariable: string = "";
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
		nodes = selected_solution.detail.system.set_nodes;
		let years_index = [
			...Array(selected_solution.detail.system.optimized_years).keys(),
		];
		years = years_index.map(
			(i) => i + selected_solution!.detail.system.reference_year,
		);
	}

	function update_technologies() {
		selected_node = null;
		selected_year = null;
		technologies = selected_solution?.detail.system.set_technologies ?? [];
		technologies = technologies.filter(
			(technology) =>
				selected_solution?.detail.reference_carrier[technology] ==
				selected_carrier,
		);

		if (technologies.length == 1) {
			selected_technology = technologies[0];
		}
	}
</script>

<h2>Production</h2>
<SolutionFilter on:solution_selected={activate_solution} />

{#if selected_solution != null}
	<div class="row">
		<div class="col">
			<h3>Variable</h3>
			<select bind:value={selected_variable}>
				{#each Object.entries(variables) as [variable, subvalues]}
					<option value={variable}>
						{variable}
					</option>
				{/each}
			</select>
			{#if selected_variable != null && variables[selected_variable] != null}
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="variableRadios"
						id="specificationRadio1"
						value="selected_subvariable"
						checked
					/>
					<label class="form-check-label" for="specificationRadio1">
						{variables[selected_variable][0]}
					</label>
				</div>
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="variableRadios"
						id="specificationRadio1"
						value="option2"
					/>
					<label class="form-check-label" for="exampleRadios2">
						{variables[selected_variable][1]}
					</label>
				</div>
			{/if}
		</div>
	</div>
	{#if selected_variable != null}
		<div class="row">
			<div class="col">
				<h3>Carrier</h3>
				<select
					bind:value={selected_carrier}
					on:change={() => update_technologies()}
				>
					{#each carriers as carrier}
						<option value={carrier}>
							{carrier}
						</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
	{#if technologies.length > 0}
		<div class="row">
			<div class="col">
				<h3>Technology</h3>
				{#each technologies as technology}
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							value=""
							id={technology + "_checkbox"}
						/>
						<label
							class="form-check-label"
							for={technology + "_checkbox"}
						>
							{technology}
						</label>
					</div>
				{/each}
			</div>
		</div>
		<div class="row">
			<div class="col">
				<h3>Node</h3>
				{#each nodes as node}
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							value=""
							id={node + "_checkbox"}
						/>
						<label
							class="form-check-label"
							for={node + "_checkbox"}
						>
							{node}
						</label>
					</div>
				{/each}
			</div>
		</div>
		<div class="row">
			<div class="col">
				<h3>Year</h3>
				{#each years as year}
					<div class="form-check">
						<input
							class="form-check-input"
							type="checkbox"
							value=""
							id={year + "_checkbox"}
						/>
						<label
							class="form-check-label"
							for={year + "_checkbox"}
						>
							{year}
						</label>
					</div>
				{/each}
			</div>
		</div> 
	{/if}
{/if}

<ComponentBarChart bind:component_data={data} on:change={reset_form} />
