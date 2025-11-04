<script lang="ts">
	import type { ActivatedSolution } from '$lib/types';
	import { onMount, tick, untrack } from 'svelte';
	import SolutionFilter from './SolutionFilter.svelte';
	import { getURLParamAsArray, updateURLParams } from '$lib/queryParams.svelte';

	import { generateScenarioYears } from './manager.svelte';

	interface Props {
		solutions?: (ActivatedSolution | null)[];
		loading?: boolean;
		years?: number[];
		nodes?: string[];
		carriers?: string[];
		disabled?: boolean;
		urlParamSolutions?: string | null;
		urlParamScenarios?: string | null;
		onSelected?: (solutions: (ActivatedSolution | null)[]) => void;
	}
	let {
		solutions = $bindable([]),
		loading = $bindable(false),
		years = $bindable([]),
		nodes = $bindable([]),
		carriers = $bindable([]),
		disabled = false,
		urlParamSolutions = 'solutions',
		urlParamScenarios = 'scenarios',
		onSelected
	}: Props = $props();

	let activeFirstLevel: string = $state('');
	let activeSecondLevels: string[] = $state(solutions.map(() => ''));
	let activeScenarios: string[] = $state(solutions.map(() => ''));

	let loadingSolutionsFromParams: boolean = $state(false);

	let solutionFilters: SolutionFilter[] = $state([]);

	let moreSolutionsExist: boolean = $derived.by(() => {
		if (activeFirstLevel == '') return false;
		return solutionFilters.some((filter: SolutionFilter) =>
			filter?.moreSolutionsExist ? filter.moreSolutionsExist() : true
		);
	});

	let componentMounted: boolean = $state(false);
	onMount(async () => {
		if (urlParamSolutions == null || urlParamScenarios == null) {
			return;
		}

		const solutionParams = getURLParamAsArray(urlParamSolutions);
		const scenarioParams = getURLParamAsArray(urlParamScenarios);
		if (solutionParams.length == 0 || solutionParams.length != scenarioParams.length) {
			componentMounted = true;
			return;
		}

		activeFirstLevel = solutionParams[0].split('.')[0];
		activeSecondLevels = solutionParams.map((s) => s.split('.')[1] || '');
		activeScenarios = scenarioParams;
		solutions = solutionParams.map(() => null);
		loadingSolutionsFromParams = true;

		emitUpdateEvent();

		componentMounted = true;
	});

	$effect(() => {
		// Update URL params when this value changes
		solutions.map((s) => (s == null ? null : `${s.solution_name}.${s.scenario_name}`));
		tick().then(() => {
			if (urlParamSolutions == null || urlParamScenarios == null || solutions.length == 0) {
				return;
			}
			updateURLParams({
				[urlParamSolutions]: solutions
					.filter((s) => s != null)
					.map((s) => s.solution_name)
					.join('~'),
				[urlParamScenarios]: solutions
					.filter((s) => s != null)
					.map((s) => s.scenario_name)
					.join('~')
			});
		});
	});

	$effect(() => {
		if (solutions.length > 1 && solutions[0] === null && !loadingSolutionsFromParams) {
			tick().then(() => {
				// If the first solution was null, remove all other solutions
				solutions.splice(1);
				activeSecondLevels.splice(1);
				activeScenarios.splice(1);
			});
		}
	});

	$effect(() => {
		if (loadingSolutionsFromParams && solutions[0] !== null) {
			loadingSolutionsFromParams = false;
		}
	});

	$effect(() => {
		if (solutions.length > 0 && solutions[0] !== null) {
			years = generateScenarioYears(solutions[0].detail);
			nodes = solutions[0].detail.system.set_nodes;
		}
	});

	function getSolutionsToExclude(idx: number): [string, string][] {
		return solutions
			.map((solution, i) => {
				if (i === idx || solution == null) {
					return null;
				}
				return [activeSecondLevels[i], activeScenarios[i]] as [string, string];
			})
			.filter((s) => s != null);
	}

	function addSolution() {
		solutions.push(null);
		activeSecondLevels.push('');
		activeScenarios.push('');
	}

	function deleteSolution(idx: number) {
		solutions.splice(idx, 1);
		activeSecondLevels.splice(idx, 1);
		activeScenarios.splice(idx, 1);
	}

	function emitUpdateEvent() {
		onSelected?.(solutions);
	}
</script>

{#if !componentMounted}
	<!-- Not showing anything while mounting component -->
{:else}
	{#each solutions as _, idx}
		<div class={[
			idx > 0 && 'border-t border-gray-300 dark:border-gray-600'
		]}>
			<!-- This is necessary to prevent weird loading issues when switching between solutions -->
			{#if activeSecondLevels[idx] !== undefined && activeScenarios[idx] !== undefined}
				<SolutionFilter
					bind:this={solutionFilters[idx]}
					bind:selected_solution={solutions[idx]}
					bind:activeFirstLevel
					bind:activeSecondLevel={activeSecondLevels[idx]}
					bind:activeScenario={activeScenarios[idx]}
					bind:loading
					excludeSolutions={getSolutionsToExclude(idx)}
					solutionSelected={emitUpdateEvent}
					{disabled}
					withoutSolution={idx > 0}
					urlParamSolution={null}
					urlParamScenario={null}
				/>
			{/if}
			{#if idx > 0}
				<div class="row mb-2">
					<div class="offset-md-3 col-md-9">
						<button class="text-red-500 hover:text-red-600" onclick={() => deleteSolution(idx)}>
							<i class="bi bi-trash3 me-1"></i>
							Remove solution from comparison
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}
	{#if moreSolutionsExist && !solutions.includes(null)}
		<div class="mb-2">
			<button class="text-blue-500 hover:text-blue-600" onclick={addSolution}>
				<i class="bi bi-plus-lg me-1"></i>
				Add solution to compare
			</button>
		</div>
	{/if}
{/if}
