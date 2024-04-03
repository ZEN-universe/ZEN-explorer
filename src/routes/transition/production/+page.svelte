<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import ComponentBarChart from "./ComponentBarChart.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";

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
	let selected_carrier: string | null = null;
	let technologies: string[] = [];
	let selected_technology: string | null = null;
	let selected_subvariable: string | null = null;

	function reset_form() {
		selected_solution = null;
		selected_node = null;
		selected_year = null;
		selected_node = null;
		selected_carrier = null;
		selected_variable = null;
	}

	function activate_solution(
		solution_object: CustomEvent<ActivatedSolution | null>,
	) {
		selected_solution = solution_object.detail;

		if (selected_solution == null) {
			return;
		}

		nodes = selected_solution.detail.system.set_nodes;
		let years_index = [
			...Array(selected_solution.detail.system.optimized_years).keys(),
		];
		years = years_index.map(
			(i) => i + selected_solution!.detail.system.reference_year,
		);
		update_carriers();
	}

	function update_carriers() {
		if (selected_solution == null) {
			carriers = [];
		}
		if (selected_variable == "import_export") {
			if (selected_subvariable == "import") {
				carriers = selected_solution!.detail.carriers_import;
			} else {
				carriers = selected_solution!.detail.carriers_export;
			}
		} else {
			carriers = selected_solution!.detail.system.set_carriers;
		}

		console.log(selected_solution);
	}

	function updated_variable() {
		if (selected_variable == null) {
			return;
		}

		selected_node = null;
		selected_year = null;
		technologies = selected_solution?.detail.system.set_technologies ?? [];
		switch (selected_variable) {
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
			case "import_export":
				technologies =
					selected_solution!.detail.system
						.set_bidirectional_transport_technologies;
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

		if (variables[selected_variable] != null) {
			selected_subvariable = variables[selected_variable]![0];
		}
		update_carriers();
	}
</script>

<h2>Production</h2>
<SolutionFilter on:solution_selected={activate_solution} />

{#if selected_solution != null}
	<div class="row">
		<div class="col">
			<h3>Variable</h3>
			<select bind:value={selected_variable} on:change={updated_variable}>
				{#each Object.entries(variables) as [variable, subvalues]}
					<option value={variable}>
						{variable}
					</option>
				{/each}
			</select>
			{#if variables && selected_variable && variables[selected_variable] != null}
				<div class="form-check">
					<input
						class="form-check-input"
						type="radio"
						name="variableRadios"
						id="specificationRadio1"
						value={variables[selected_variable][0]}
						on:change={() => {
							selected_subvariable =
								variables[selected_variable][0];
							update_carriers();
						}}
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
						value={variables[selected_variable][1]}
						on:change={() => {
							selected_subvariable =
								variables[selected_variable][1];
							update_carriers();
						}}
					/>
					<label class="form-check-label" for="exampleRadios2">
						<!-- @ts-ignore -->
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
					on:change={() => updated_variable()}
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
	{#if technologies.length > 0 && selected_variable != "import_export"}
		<div class="row">
			<div class="col">
				<h3>Technology</h3>
				<AllCheckbox bind:elements={technologies}></AllCheckbox>
			</div>
		</div>
	{/if}
	{#if selected_variable != null && selected_carrier != null && (selected_variable == "import_export" || technologies.length > 0)}
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

<ComponentBarChart bind:component_data={data} on:change={reset_form} />
