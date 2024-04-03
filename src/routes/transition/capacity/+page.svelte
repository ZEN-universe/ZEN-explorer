<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import ComponentBarChart from "./ComponentBarChart.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";

	let data: Papa.ParseResult<any>;
	let technology_types: string[] = ["conversion", "storage", "transport"];
	let variables: string[] = ["capacity", "capacity_addition"];
	let carriers: string[] = [];
	let selected_carrier: string | null = null;
	let nodes: string[] = [];
	let years: number[] = [];
	let technologies: string[] = [];

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
	}

	function update_technologies() {
		selected_node = null;
		selected_year = null;
		technologies = [];
		if (selected_carrier === null) {
			return;
		}

		if (selected_technology_type === null) {
			return;
		}

		switch (selected_technology_type) {
			case "conversion":
				technologies =
					selected_solution!.detail.system
						.set_conversion_technologies;
				break;
			case "storage":
				technologies =
					selected_solution!.detail.system.set_storage_technologies;
				break;
			case "transport":
				technologies =
					selected_solution!.detail.system.set_transport_technologies;
				break;
		}

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

<h2>Capacity</h2>
<SolutionFilter on:solution_selected={activate_solution} />

{#if selected_solution != null}
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
	{#if selected_variable != null}
		<div class="row">
			<div class="col">
				<h3>Technology Type</h3>
				<select
					bind:value={selected_technology_type}
					on:change={() => update_technologies()}
				>
					{#each technology_types as technology_type}
						<option value={technology_type}>
							{technology_type}
						</option>
					{/each}
				</select>
				{#if selected_technology_type == "storage"}
					<div class="form-check">
						<input
							class="form-check-input"
							type="radio"
							name="storageRadios"
							id="storageSpecificationRadio1"
							value="energy"
							checked
						/>
						<label
							class="form-check-label"
							for="storageSpecificationRadio1"
						>
							Energy
						</label>
					</div>
					<div class="form-check">
						<input
							class="form-check-input"
							type="radio"
							name="storageRadios"
							id="storageSpecificationRadio1"
							value="option2"
						/>
						<label class="form-check-label" for="exampleRadios2">
							Power
						</label>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	{#if selected_technology_type != null}
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
				<AllCheckbox bind:elements={technologies}></AllCheckbox>
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
					No technologies for the selected technology type and
					carrier.
				</h4>
			</div>
		</div>
	{/if}
{/if}

<ComponentBarChart bind:component_data={data} on:change={reset_form} />
