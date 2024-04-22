<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import { filter_and_aggregate_data } from "$lib/utils";
	import Radio from "../../../components/Radio.svelte";
	import { get_component_total } from "$lib/temple";
	import { tick } from "svelte";

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
	let aggregation_options = ["technology", "node"];
	let filtered_data: any[] | null = null;
	let unit: string = "";

	let selected_solution: ActivatedSolution | null = null;
	let selected_node: string | null = null;
	let selected_year: string | null = null;
	let selected_variable: string | null = null;
	let selected_carrier: string | null = null;
	let technologies: string[] = [];
	let selected_technologies: string[] = [];
	let selected_nodes: string[] = [];
	let selected_subvariable: string | null = null;
	let selected_years: number[] = [];
	let normalisation_options = ["not_normalized", "normalized"];
	let selected_normalisation: string = "not_normalized";

	interface StringList {
		[key: string]: string[];
	}

	let selected_aggregation = "technology";

	function reset_form() {
		selected_solution = null;
		selected_node = null;
		selected_year = null;
		selected_node = null;
		selected_carrier = null;
		selected_variable = null;
	}

	function get_variable_name() {
		switch (selected_variable) {
			case "conversion":
				return "flow_conversion_" + selected_subvariable;
			case "storage":
				return "flow_storage_" + selected_subvariable;
			case "transport":
				return "flow_transport";
			case "import_export":
				return "flow_" + selected_subvariable;
			default:
				return null;
		}
	}

	async function fetch_data() {
		await tick();

		let variable_name = get_variable_name();

		if (variable_name === null) {
			return;
		}

		get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
		).then((fetched) => {
			data = fetched.data;
			unit = fetched.unit;
		});
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
	}

	function update_technologies() {
		console.log(selected_variable, selected_carrier);
		if (selected_variable == null) {
			return;
		}
		if (selected_carrier == null) {
			return;
		}

		technologies = selected_solution?.detail.system.set_technologies ?? [];
		switch (selected_variable) {
			case "conversion":
				technologies = [];
				let relevant_carriers =
					selected_solution!.detail.carriers_input;
				if (selected_subvariable == "output") {
					relevant_carriers =
						selected_solution!.detail.carriers_output;
				}
				for (const technology in relevant_carriers) {
					console.log();
					if (
						relevant_carriers[technology].includes(selected_carrier)
					) {
						technologies.push(technology);
					}
				}
				break;
			case "storage":
				technologies = technologies.filter(
					(technology) =>
						selected_solution?.detail.reference_carrier[
							technology
						] == selected_carrier,
				);

				break;
			case "transport":
				technologies = technologies.filter(
					(technology) =>
						selected_solution?.detail.reference_carrier[
							technology
						] == selected_carrier,
				);

				break;
			case "import_export":
				technologies = [];
				break;
		}

		if (technologies.length == 1) {
			selected_technologies = [technologies[0]];
		}

		fetch_data();
	}

	function updated_variable() {
		if (selected_variable == null) {
			return;
		}

		selected_node = null;
		selected_year = null;

		if (variables[selected_variable] != null) {
			selected_subvariable = variables[selected_variable]![0];
		}

		update_carriers();
		update_technologies();
	}

	function update_data() {
		if (selected_aggregation == "technology") {
			selected_nodes = nodes;
		} else {
			selected_technologies = technologies;
		}

		if (
			selected_nodes.length == 0 ||
			selected_years.length == 0 ||
			selected_technologies.length == 0 ||
			data === null
		) {
			filtered_data = null;
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (selected_aggregation == "technology") {
			dataset_selector["location"] = selected_nodes;
			datasets_aggregates["technology"] = selected_technologies;
		} else {
			dataset_selector["technology"] = selected_technologies;
			datasets_aggregates["location"] = selected_nodes;
		}

		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == "normalized",
		);
	}
</script>

<div class="row">
	<div class="col">
		<h2>Production</h2>
	</div>
</div>
<div class="row">
	<div class="col position-relative">
		<div class="filters" style="position: absolute; width: 100%;">
			<div class="accordion" id="accordionExample">
				<div class="accordion-item solution-selection">
					<h2 class="accordion-header">
						<button
							class="accordion-button"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseOne"
							aria-expanded="true"
							aria-controls="collapseOne"
						>
							Solution Selection
						</button>
					</h2>
					<div
						id="collapseOne"
						class="accordion-collapse collapse show"
						data-bs-parent="#accordionExample"
					>
						<div class="accordion-body">
							<SolutionFilter
								on:solution_selected={update_carriers}
								bind:carriers
								bind:nodes
								bind:years
								bind:selected_solution
							/>
						</div>
					</div>
				</div>
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseTwo"
							aria-expanded="false"
							aria-controls="collapseTwo"
						>
							Variable Selection
						</button>
					</h2>
					<div
						id="collapseTwo"
						class="accordion-collapse collapse"
						data-bs-parent="#accordionExample"
					>
						<div class="accordion-body">
							<select
								bind:value={selected_variable}
								on:change={updated_variable}
							>
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
											update_technologies();
										}}
										checked
									/>
									<label
										class="form-check-label"
										for="specificationRadio1"
									>
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
											update_technologies();
										}}
									/>
									<label
										class="form-check-label"
										for="exampleRadios2"
									>
										<!-- @ts-ignore -->
										{variables[selected_variable][1]}
									</label>
								</div>
							{/if}
							{#if selected_variable != null}
								<div class="row">
									<div class="col">
										<h3>Carrier</h3>
										<select
											bind:value={selected_carrier}
											on:change={() =>
												update_technologies()}
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
						</div>
					</div>
				</div>
				<div class="accordion-item">
					<h2 class="accordion-header">
						<button
							class="accordion-button collapsed"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#collapseThree"
							aria-expanded="false"
							aria-controls="collapseThree"
						>
							Data Selection
						</button>
					</h2>
					<div
						id="collapseThree"
						class="accordion-collapse collapse"
						data-bs-parent="#accordionExample"
					>
						<div class="accordion-body">
							{#if technologies.length > 0}
								<div class="row">
									<div class="col-6">
										<h3>Aggregation</h3>
										<Radio
											bind:options={aggregation_options}
											bind:selected_option={selected_aggregation}
											on:selection-changed={(e) => {
												update_data();
											}}
										></Radio>
									</div>
									<div class="col-6">
										<h3>Normalisation</h3>
										<Radio
											bind:options={normalisation_options}
											bind:selected_option={selected_normalisation}
											on:selection-changed={(e) => {
												update_data();
											}}
										></Radio>
									</div>
								</div>
								{#if selected_aggregation == "technology"}
									<h3>Technology</h3>
									<AllCheckbox
										on:selection-changed={() => {
											update_data();
										}}
										bind:selected_elements={selected_technologies}
										bind:elements={technologies}
									></AllCheckbox>
								{:else}
									<h3>Node</h3>
									<AllCheckbox
										on:selection-changed={(e) => {
											update_data();
										}}
										bind:selected_elements={selected_nodes}
										bind:elements={nodes}
									></AllCheckbox>
								{/if}

								<h3>Year</h3>
								<AllCheckbox
									on:selection-changed={(e) => {
										update_data();
									}}
									bind:selected_elements={selected_years}
									bind:elements={years}
								></AllCheckbox>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
