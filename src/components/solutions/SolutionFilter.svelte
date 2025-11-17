<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import type { ActivatedSolution } from '$lib/types';
	import { getURLParam, updateURLParams } from '$lib/queryParams.svelte';
	import { removeDuplicates } from '$lib/utils';

	import Dropdown from '$components/forms/Dropdown.svelte';

	import {
		getSolutionList,
		getSolutionDetail,
		initSolutionList,
		getActivatedSolution,
		generateScenarioYears
	} from './manager.svelte';
	initSolutionList();

	interface Props {
		carriers?: string[];
		nodes?: string[];
		years?: number[];
		selected_solution: ActivatedSolution | null;
		activeFirstLevel?: string;
		activeSecondLevel?: string;
		activeScenario?: string;
		excludeSolutions?: [string, string][];
		loading?: boolean;
		disabled?: boolean;
		withoutSolution?: boolean;
		urlParamSolution?: string | null;
		urlParamScenario?: string | null;
		solutionSelected?: (selected_solution: ActivatedSolution | null) => void;
	}

	let {
		carriers = $bindable([]),
		nodes = $bindable([]),
		years = $bindable([]),
		selected_solution: selectedSolution = $bindable(),
		activeFirstLevel = $bindable(''),
		activeSecondLevel = $bindable(''),
		activeScenario = $bindable(''),
		excludeSolutions = [],
		loading = $bindable(false),
		disabled = true,
		withoutSolution = false,
		urlParamSolution = 'solution',
		urlParamScenario = 'scenario',
		solutionSelected: solutionSelected
	}: Props = $props();

	let firstLevels: string[] = $derived(
		removeDuplicates(getSolutionList().map((solution) => solution.name.split('.')[0]))
	);

	let secondLevels: string[] = $derived.by(() => {
		if (activeFirstLevel == '') return [];

		const excludedSecondLevels = new Set(excludeSolutions.map((s) => s[0]));
		const secondLevels: string[] = [];
		getSolutionList().forEach((solution) => {
			const parts = solution.name.split('.');
			if (
				solution.name.startsWith(activeFirstLevel) &&
				parts.length > 1 &&
				(solution.scenarios.length > 0 || !excludedSecondLevels.has(parts[1]))
			) {
				secondLevels.push(parts[1]);
			}
		});
		return secondLevels;
	});

	let allScenarios: string[] = $state([]);
	let scenarios: string[] = $derived.by(() => {
		const excludedScenarios = new Set(
			excludeSolutions.filter((s) => s[0] == activeSecondLevel).map((s) => s[1])
		);
		return allScenarios.filter((s) => !excludedScenarios.has(s));
	});

	let activeSolutionName: string | null = $derived.by(() => {
		if (firstLevels.length > 0 && secondLevels.length == 0) {
			return activeFirstLevel || null;
		}
		if (activeFirstLevel && activeSecondLevel) {
			return `${activeFirstLevel}.${activeSecondLevel}`;
		}
		return null;
	});

	let initialFirstLevel: boolean = $state(true);
	let initialSecondLevel: boolean = $state(true);

	// Set active selections from URL parameters
	onMount(async () => {
		if (urlParamSolution == null || urlParamScenario == null) {
			return;
		}
		const solutionParam = getURLParam(urlParamSolution)?.split('.') || ['', ''];
		activeFirstLevel = solutionParam[0];
		activeSecondLevel = solutionParam[1];
		activeScenario = getURLParam(urlParamScenario) || '';
	});

	// Update selected_solution when activeSolutionName or activeScenario changes
	$effect(() => {
		activeSolutionName;
		activeScenario;
		untrack(updateSolutionDetails);
	});

	// Update URL parameters when active selections change
	$effect(() => {
		selectedSolution;
		tick().then(() => {
			if (urlParamSolution == null || urlParamScenario == null || selectedSolution == null) {
				return;
			}
			updateURLParams({
				[urlParamSolution]: selectedSolution.solution_name,
				[urlParamScenario]: scenarios.length > 1 ? selectedSolution.scenario_name : null
			});
		});
	});

	// Update carriers, nodes, years
	$effect(() => {
		if (!selectedSolution) {
			carriers = [];
			nodes = [];
			years = [];
			return;
		}

		carriers = selectedSolution.detail.system.set_carriers.slice().sort();
		nodes = selectedSolution.detail.system.set_nodes.slice().sort();
		years = generateScenarioYears(selectedSolution.detail);
	});

	$effect(() => {
		activeFirstLevel;
		untrack(() => {
			if (initialFirstLevel) {
				initialFirstLevel = false;
				return;
			}
			activeSecondLevel = secondLevels.length === 1 ? secondLevels[0] : '';
			activeScenario = '';
		});
	});

	$effect(() => {
		activeSecondLevel;
		untrack(() => {
			if (initialSecondLevel) {
				initialSecondLevel = false;
				return;
			}
			activeScenario = '';
		});
	});

	$effect(() => {
		if (secondLevels.length === 1) {
			activeSecondLevel = secondLevels[0];
		}
	});

	async function updateSolutionDetails() {
		// Wait for all effects to finish, e.g. to reset activeSecondLevel, activeScenario
		await tick();

		if (activeSolutionName === null) {
			selectedSolution = null;
			allScenarios = [];
			return;
		}

		if (
			selectedSolution !== null &&
			selectedSolution.solution_name === activeSolutionName &&
			selectedSolution.scenario_name === activeScenario
		) {
			return;
		}

		// Fetch solution details
		loading = true;
		const solutionDetail = await getSolutionDetail(activeSolutionName);
		allScenarios = Object.keys(solutionDetail.scenarios);

		// Update the selected solution object
		if (scenarios.length == 1) {
			activeScenario = scenarios[0];
		}

		// Abort if the active scenario is invalid
		if (activeScenario == '' || !(activeScenario in solutionDetail.scenarios)) {
			activeScenario = '';
			selectedSolution = null;
			loading = false;
			return;
		}

		// Update the selected solution
		selectedSolution = getActivatedSolution(activeSolutionName, activeScenario, solutionDetail);

		// Notify parent component of selected solution change
		solutionSelected?.(selectedSolution);
		loading = false;
	}

	export function moreSolutionsExist(): boolean {
		if (activeFirstLevel == '') return false;
		return secondLevels.length > 1 || scenarios.length > 1;
	}
</script>

{#if !withoutSolution}
	<Dropdown bind:value={activeFirstLevel} label="Solution" {disabled} options={firstLevels}
	></Dropdown>
{/if}
{#if secondLevels.length > 0}
	<Dropdown bind:value={activeSecondLevel} label="Subsolution" {disabled} options={secondLevels}
	></Dropdown>
{/if}

{#if allScenarios.length > 1}
	<Dropdown bind:value={activeScenario} label="Scenario" {disabled} options={scenarios}></Dropdown>
{/if}
