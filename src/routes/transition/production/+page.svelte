<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import { filter_and_aggregate_data } from "$lib/utils";
	import BarPlot from "../../../components/plots/BarPlot.svelte";

	import Radio from "../../../components/Radio.svelte";
	import { get_component_total } from "$lib/temple";
	import { tick } from "svelte";
	import Papa from "papaparse";

	let data: Papa.ParseResult<any>;
	let carriers: string[] = [];
	let nodes: string[] = [];
	let edges: string[] = [];
	let locations: string[] = [];
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
	let selected_solution: ActivatedSolution | null = null;
	let selected_variable: string | null = null;
	let selected_carrier: string | null = null;
	let technologies: string[] = [];
	let selected_technologies: string[] = [];
	let selected_locations: string[] = [];
	let selected_subvariable: string | null = null;
	let selected_years: number[] = [];
	let normalisation_options = ["not_normalized", "normalized"];
	let selected_normalisation: string = "not_normalized";
	let solution_loading: boolean = false;
	let fetching = false;
	let plot_name = "plot";

	interface StringList {
		[key: string]: string[];
	}

	let selected_aggregation = "node";
	let datasets: any[] = [];
	let config = {
		type: "bar",
		data: { datasets: datasets },
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
						text: selected_variable + " [" + get_unit() + "]",
					},
				},
			},
		},
	};

	function reset_data_selection() {
		selected_years = years;
		selected_locations = nodes;
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

	function get_unit() {
		if (unit === null) {
			return "";
		}
		for (const u of unit.data) {
			if (
				technologies[0] == u.technology &&
				(u.carrier == selected_carrier || u.carrier === undefined)
			) {
				return u[0];
			}
		}
		return "";
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
			if (fetched.data === null) {
				return;
			}

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
				technologies =
					selected_solution?.detail.system.set_storage_technologies.filter(
						(technology) =>
							selected_solution?.detail.reference_carrier[
								technology
							] == selected_carrier,
					) ?? [];

				break;
			case "transport":
				technologies =
					selected_solution?.detail.system.set_transport_technologies.filter(
						(technology) =>
							selected_solution?.detail.reference_carrier[
								technology
							] == selected_carrier,
					) ?? [];

				break;
			case "import_export":
				technologies = [];
				break;
		}

		if (technologies.length == 1) {
			selected_technologies = [technologies[0]];
		}

		reset_data_selection();
	}

	function update_locations() {
		locations = nodes;
		if (selected_variable == "transport") {
			locations = edges;
		}
	}

	function updated_variable() {
		filtered_data = [];

		if (selected_variable == null) {
			return;
		}

		if (variables[selected_variable] != null) {
			selected_subvariable = variables[selected_variable]![0];
		}

		if (selected_variable == "import_export") {
			selected_aggregation = "technology";
		}

		fetch_data().then(() => {
			update_carriers();
			update_technologies();
			update_locations();
			update_data();
		});
	}

	function update_data() {
		if (selected_variable == "import_export") {
			selected_aggregation = "node";
		}

		if (selected_aggregation == "technology") {
			selected_locations = nodes;
		} else {
			selected_technologies = technologies;
		}

		if (
			selected_locations.length == 0 ||
			selected_years.length == 0 ||
			(selected_technologies.length == 0 &&
				selected_variable != "import_export") ||
			!data
		) {
			filtered_data = [];
			return;
		}

		let dataset_selector: StringList = {};
		let datasets_aggregates: StringList = {};
		let location_name = "node";

		if (selected_variable == "transport") {
			location_name = "edge";
		}

		if (selected_variable == "import_export") {
			dataset_selector[location_name] = selected_locations;
			datasets_aggregates["carrier"] = [selected_carrier!];
		} else {
			if (selected_aggregation == "technology") {
				dataset_selector[location_name] = selected_locations;
				datasets_aggregates["technology"] = selected_technologies;
			} else {
				dataset_selector["technology"] = selected_technologies;
				datasets_aggregates[location_name] = selected_locations;
			}
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

		config.data = { datasets: filtered_data };
		config.options.scales.y.title.text =
			selected_variable + " [" + get_unit() + "]";

		let solution_names = selected_solution!.solution_name.split(".");
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			get_variable_name(),
			selected_carrier,
		].join("_");
	}
</script>

<div class="row">
	<div class="col">
		<h2>Production</h2>
	</div>
</div>
<div class="row">
	<div class="col position-relative" style="z-index: 1; position: relative;">
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
								bind:edges
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
											fetch_data();
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
				{#if !fetching && selected_carrier && (technologies.length > 0 || selected_variable == "import_export")}
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
									{#if selected_variable != "import_export"}
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
									{/if}
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
										bind:selected_elements={selected_locations}
										bind:elements={locations}
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
		{:else if technologies.length == 0 && selected_variable != "import_export"}
			<div class="text-center">No technologies with this selection.</div>
		{:else if filtered_data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<BarPlot bind:config bind:plot_name></BarPlot>
		{/if}
	</div>
</div>
