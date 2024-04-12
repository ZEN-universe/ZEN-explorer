<script lang="ts">
	import SolutionFilter from "../../../components/SolutionFilter.svelte";
	import AllCheckbox from "../../../components/AllCheckbox.svelte";
	import Radio from "../../../components/Radio.svelte";
	import BarPlot from "../../../components/plots/BarPlot.svelte";
	import type { ActivatedSolution, Row } from "$lib/types";
	import { get_component_data } from "$lib/temple";
	import { filter_and_aggregate_data } from "$lib/utils";
	import { tick } from "svelte";

	import type ChartDataset from "chart.js/auto";

	interface StringList {
		[key: string]: string[];
	}

	let technology_types: string[] = ["conversion", "storage", "transport"];
	let data: Papa.ParseResult<Row> | null = null;
	let filtered_data: ChartDataset[] | null = null;
	let variables: string[] = ["capacity", "capacity_addition"];
	let carriers: string[] = [];
	let nodes: string[] = [];
	let years: number[] = [];
	let technologies: string[] = [];
	let aggregation_options = ["technology", "node"];
	let normalisation_options = ["not_normalized", "normalized"];
	let storage_type_options = ["energy", "power"];

	let selected_solution: ActivatedSolution | null = null;
	let selected_variable: string | null = null;
	let selected_carrier: string | null = null;
	let selected_storage_type = "energy";
	let selected_aggregation = "technology";
	let selected_technology_type: string | null = null;
	let selected_technologies: string[] = [];
	let selected_years: number[] = [];
	let selected_nodes: string[] = [];
	let selected_normalisation: string = "not_normalized";

	function reset_form() {
		selected_technology_type = null;
		selected_variable = null;
		selected_technology_type = null;
		selected_carrier = null;
		reset_data_selection();
	}

	function reset_data_selection() {
		selected_normalisation = "not_normalized";
		selected_nodes = [];
		selected_technologies = [];
		selected_years = [];
	}
	async function fetch_data() {
		await tick();

		if (selected_variable === null) {
			return;
		}

		get_component_data(
			selected_solution!.solution_name,
			selected_variable,
			selected_solution!.scenario_name,
		).then((fetched) => {
			data = fetched;
		});
	}

	function activate_solution(
		solution_object: CustomEvent<ActivatedSolution | null>,
	) {
		selected_solution = solution_object.detail;
		reset_form();
		update_data();

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

		if (selected_technology_type == "storage") {
			datasets_aggregates["capacity_type"] = [selected_storage_type];
		} else {
			datasets_aggregates["capacity_type"] = storage_type_options;
		}

		let excluded_years = years
			.filter((year) => !selected_years.includes(year))
			.map(
				(year) =>
					year - selected_solution!.detail.system.reference_year,
			);

		filtered_data = filter_and_aggregate_data(
			data.data,
			dataset_selector,
			datasets_aggregates,
			excluded_years,
			selected_normalisation == "normalized",
			selected_solution!.detail.system.reference_year,
		);
	}
</script>

<div class="row">
	<div class="col">
		<h2>Capacity</h2>
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
								on:solution_selected={activate_solution}
							/>
						</div>
					</div>
				</div>
				<div class="accordion-item variable-selection">
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
							<h3>Variable</h3>
							<select
								on:change={() => {
									fetch_data();
									selected_technology_type = null;
									selected_carrier = null;
									reset_data_selection();
									update_data();
								}}
								bind:value={selected_variable}
							>
								{#each variables as variable}
									<option value={variable}>
										{variable}
									</option>
								{/each}
							</select>

							{#if selected_variable != null}
								<h3>Technology Type</h3>
								<select
									bind:value={selected_technology_type}
									on:change={() => {
										update_technologies();
										update_data();
									}}
								>
									{#each technology_types as technology_type}
										<option value={technology_type}>
											{technology_type}
										</option>
									{/each}
								</select>
								{#if selected_technology_type == "storage"}
									<Radio
										bind:options={storage_type_options}
										bind:selected_option={selected_storage_type}
										on:selection-changed={() => {
											update_technologies();
											update_data();
										}}
									></Radio>
								{/if}
							{/if}
							{#if selected_technology_type != null}
								<h3>Carrier</h3>
								<select
									bind:value={selected_carrier}
									on:change={() => {
										update_technologies();
										update_data();
									}}
								>
									{#each carriers as carrier}
										<option value={carrier}>
											{carrier}
										</option>
									{/each}
								</select>
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
							{:else if selected_technology_type != null && selected_carrier != null}
								<h4>
									No technologies for the selected technology
									type and carrier.
								</h4>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if filtered_data != null}
	<div class="row">
		<div class="col" style="margin-top: 200px;">
			<BarPlot
				bind:datasets={filtered_data}
				bind:year_offset={selected_solution.detail.system
					.reference_year}
			></BarPlot>
		</div>
	</div>
{/if}
