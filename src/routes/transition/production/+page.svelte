<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import { filter_and_aggregate_data } from "$lib/utils";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

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
	let unit: Papa.ParseResult<any> | null = null;
	let current_unit: string = "";
	let selected_solution: ActivatedSolution | null = null;
	let selected_variable: string | null = null;
	let selected_carrier: string | null = null;
	let technologies: string[] = [];
	let selected_technologies: string[] = [];
	let selected_nodes: string[] = [];
	let selected_subvariable: string | null = null;
	let selected_years: number[] = [];
	let normalisation_options = ["not_normalized", "normalized"];
	let selected_normalisation: string = "not_normalized";
	let solution_loading: boolean = false;
	let fetching = false;

	interface StringList {
		[key: string]: string[];
	}

	let selected_aggregation = "technology";

	let config = {
		type: "bar",
		data: { datasets: [] },
		options: {
			responsive: true,
			scales: {
				x: {
					stacked: true,
					title: {
						display: true,
						text: "Year",
					},
				},
				y: {
					stacked: true,
					title: {
						display: true,
						text: selected_variable + " [" + current_unit + "]",
					},
				},
			},
		},
	};

	function reset_data_selection() {
		selected_years = years;
		selected_nodes = nodes;
		selected_technologies = technologies;
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
		fetching = true;

		let variable_name = get_variable_name();
		if (variable_name === null) {
			return;
		}

		await get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		).then((fetched) => {
			data = fetched.data;
			unit = fetched.unit;
			fetching = false;
			return;
		});
	}

	function update_carriers() {
		filtered_data = null;
		selected_carrier = "";

		if (selected_solution == null) {
			carriers = [];
			return;
		}

		switch (selected_variable) {
			case "import_export":
				if (selected_subvariable == "import") {
					carriers = selected_solution!.detail.carriers_import;
				} else {
					carriers = selected_solution!.detail.carriers_export;
				}
				break;
			case "conversion":
				let relevant_carriers =
					selected_solution!.detail.carriers_output;
				if (selected_subvariable == "input") {
					relevant_carriers =
						selected_solution!.detail.carriers_input;
				}
				carriers = [];

				for (const i in relevant_carriers) {
					carriers = [
						...new Set([...carriers, ...relevant_carriers[i]]),
					];
				}

				break;
			default:
				carriers = selected_solution!.detail.system.set_carriers;
		}

		if (carriers.length == 1) {
			selected_carrier = carriers[0];
		}

		reset_data_selection();
	}

	function update_technologies() {
		filtered_data = [];

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

		if (unit && technologies.length > 0) {
			let current_units = unit.data.filter((r) =>
				technologies.includes(
					r["set_" + selected_variable + "_technologies"],
				),
			);
			if (current_units.length > 0) {
				current_unit = current_units[0][0];
			}
		}

		if (technologies.length == 1) {
			selected_technologies = [technologies[0]];
		}

		reset_data_selection();
	}

	function updated_variable() {
		filtered_data = [];

		if (selected_variable == null) {
			return;
		}

		if (variables[selected_variable] != null) {
			selected_subvariable = variables[selected_variable]![0];
		}

		fetch_data().then(() => {
			update_carriers();
			update_technologies();
			console.log("from variable", data);
			update_data();
		});
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
			!data
		) {
			filtered_data = [];
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};

		if (selected_aggregation == "technology") {
			dataset_selector["node"] = selected_nodes;
			datasets_aggregates["technology"] = selected_technologies;
		} else {
			dataset_selector["technology"] = selected_technologies;
			datasets_aggregates["node"] = selected_nodes;
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

		console.log("Data after updating", filtered_data);
		config.data = { datasets: filtered_data };
		console.log(filtered_data);
		config.options.scales.y.title.text =
			selected_variable + " [" + current_unit + "]";
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
								bind:loading={solution_loading}
								enabled={!solution_loading && !fetching}
							/>
						</div>
					</div>
				</div>

				{#if !solution_loading && selected_solution}
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
									disabled={solution_loading || fetching}
									on:change={() => {
										updated_variable();
									}}
								>
									{#each Object.entries(variables) as [variable, subvalues]}
										<option value={variable}>
											{variable}
										</option>
									{/each}
								</select>
								{#if variables && selected_variable && variables[selected_variable] != null}
									<Radio
										bind:options={variables[
											selected_variable
										]}
										bind:selected_option={selected_subvariable}
										on:selection-changed={(e) => {
											update_carriers();
											update_technologies();
											update_data();
										}}
										enabled={!solution_loading && !fetching}
									></Radio>
								{/if}
								{#if selected_variable != null}
									<div class="row">
										<div class="col">
											<h3>Carrier</h3>
											<select
												bind:value={selected_carrier}
												on:change={() => {
													update_technologies();
													update_data();
												}}
												disabled={solution_loading ||
													fetching}
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
				{/if}
				{#if !fetching && selected_carrier && technologies.length > 0 && filtered_data.length > 0}
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
								<div class="row">
									<div class="col-6">
										<h3>Aggregation</h3>
										<Radio
											bind:options={aggregation_options}
											bind:selected_option={selected_aggregation}
											on:selection-changed={(e) => {
												update_data();
											}}
											enabled={!solution_loading &&
												!fetching}
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
											enabled={!solution_loading &&
												!fetching}
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
										enabled={!solution_loading && !fetching}
									></AllCheckbox>
								{:else}
									<h3>Node</h3>
									<AllCheckbox
										on:selection-changed={(e) => {
											update_data();
										}}
										bind:selected_elements={selected_nodes}
										bind:elements={nodes}
										enabled={!solution_loading && !fetching}
									></AllCheckbox>
								{/if}

								<h3>Year</h3>
								<AllCheckbox
									on:selection-changed={(e) => {
										update_data();
									}}
									bind:selected_elements={selected_years}
									bind:elements={years}
									enabled={!solution_loading && !fetching}
								></AllCheckbox>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
<div class="row">
	<div class="col" style="margin-top: 400px;">
		{#if solution_loading || fetching}
			<div class="text-center">
				<div class="spinner-border center" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		{:else if selected_solution == null}
			<div></div>
		{:else if filtered_data == null}
			<div></div>
		{:else if technologies.length == 0}
			<div class="text-center">No technologies with this selection.</div>
		{:else if filtered_data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<BarPlot
				bind:config
				bind:year_offset={selected_solution.detail.system
					.reference_year}
			></BarPlot>
		{/if}
	</div>
</div>
