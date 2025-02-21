<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import type { ActivatedSolution } from "$lib/types";
	import { filter_and_aggregate_data } from "$lib/utils";
	import BarPlot from "../../../components/BarPlot.svelte";

	import Radio from "../../../components/Radio.svelte";
	import { get_component_total } from "$lib/temple";
	import { tick } from "svelte";
	import Papa from "papaparse";
	import { get_variable_name } from "$lib/variables";

	let data: Papa.ParseResult<any> | null = null;
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

	/**
	 * This function refetches the data from the API and then updates the carriers, technologies, locations and the plot.
	 */
	function refetch() {
		fetch_data().then(() => {
			update_carriers();
			update_technologies();
			update_locations();
			update_data();
		});
	}

	/**
	 * This function resets the selections of the form.
	 */
	function reset_data_selection() {
		selected_years = years;
		selected_locations = nodes;
		selected_technologies = technologies;
	}

	/**
	 * This function returns the variable name depending on the variable selection
	 */
	function get_local_variable() {
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

	/**
	 * This function returns the unit of the currently selected carrier
	 */
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

	/**
	 * This function fetches the relevant data from the API server given the current selection
	 */
	async function fetch_data() {
		fetching = true;
		data = null;
		let variable_name = get_local_variable();
		if (variable_name === null) {
			fetching = false;
			return;
		}

		// Get the versioned name of the variable
		variable_name = get_variable_name(
			variable_name,
			selected_solution?.version,
		);

		// Fetch the data
		let fetched = await get_component_total(
			selected_solution!.solution_name,
			variable_name,
			selected_solution!.scenario_name,
			selected_solution!.detail.system.reference_year,
			selected_solution!.detail.system.interval_between_years,
		);

		if (fetched.data === null) {
			return;
		}
		data = fetched.data;
		unit = fetched.unit;
		fetching = false;
		return;
	}

	/**
	 * This function updates the available carriers depending on the current selection and resets the data selection.
	 */
	function update_carriers() {
		if (data == null) {
			carriers = [];
			return;
		}

		if (selected_solution == null) {
			carriers = [];
			return;
		}

		filtered_data = null;
		selected_carrier = "";

		let possible_technologies = new Set(
			data!.data.map((d) => d.technology),
		);

		let possible_carriers = [
			...new Set(
				[...possible_technologies].map(
					(d) => selected_solution?.detail.reference_carrier[d],
				),
			),
		];

		if (selected_variable == "import_export") {
			possible_carriers = [...new Set(data!.data.map((d) => d.carrier))];
		}

		switch (selected_variable) {
			case get_variable_name("import_export", selected_solution?.version):
				if (selected_subvariable == "import") {
					carriers = selected_solution!.detail.carriers_import;
				} else {
					carriers = selected_solution!.detail.carriers_export;
				}
				break;
			case get_variable_name("conversion", selected_solution?.version):
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

		carriers = carriers.filter((d) => possible_carriers.includes(d));
		if (carriers.length == 1) {
			selected_carrier = carriers[0];
		}

		reset_data_selection();
	}

	/**
	 * This function updates the available technologies given the currently selected solution and variable.
	 */
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

	/**
	 * This function updates the available locations to select.
	 */
	function update_locations() {
		locations = nodes;
		if (selected_variable == "transport") {
			locations = edges;
		}

		reset_data_selection();
	}

	/**
	 * This function is being called whenever the selected variable is changed.
	 * It resets the form according to the selected variable.
	 */
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
	}

	/**
	 * This function updates the plot data according to the current form selection.
	 */
	function update_data() {
		if (selected_variable == "import_export") {
			selected_aggregation = "node";
		}

		// If the selected aggregation is technology, include all available nodes and vice versa
		if (selected_aggregation == "technology") {
			selected_locations = nodes;
		} else {
			selected_technologies = technologies;
		}

		// Check if there is data to plot
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

		// Define which series should be aggregated and which should be shown separately, depending on the selected aggregation and variable.
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

		// Filter years
		let excluded_years = years.filter(
			(year) => !selected_years.includes(year),
		);

		let filtered_result = data.data.filter(
			(a) => a.carrier === undefined || a.carrier == selected_carrier,
		);

		// Aggregate data
		filtered_data = filter_and_aggregate_data(
			filtered_result,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == "normalized",
		);

		// Set data in plot config
		config.data = { datasets: filtered_data };
		config.options.scales.y.title.text =
			selected_variable + " [" + get_unit() + "]";

		let solution_names = selected_solution!.solution_name.split(".");

		// Define filename of the plot when downloading.
		plot_name = [
			solution_names[solution_names?.length - 1],
			selected_solution?.scenario_name,
			get_variable_name(
				get_local_variable()!,
				selected_solution?.version,
			),
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
		<div class="filters">
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
								bind:carriers
								bind:nodes
								bind:years
								bind:selected_solution
								bind:edges
								bind:loading={solution_loading}
								on:solution_selected={() => {
									refetch();
								}}
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
										refetch();
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
											refetch();
										}}
										enabled={!solution_loading && !fetching}
									></Radio>
								{/if}
								{#if selected_variable != null && carriers.length > 0}
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
	<div class="col mt-4">
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
		{:else if carriers.length == 0}
			<div class="text-center">No carriers with this selection.</div>
		{:else if filtered_data.length == 0}
			<div class="text-center">No data with this selection.</div>
		{:else}
			<BarPlot bind:config bind:plot_name></BarPlot>
		{/if}
	</div>
</div>
