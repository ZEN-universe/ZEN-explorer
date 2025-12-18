import { fetchSolutionDetail, fetchSolutions } from '$lib/temple';
import type { ActivatedSolution, ScenarioDetail, Solution, SolutionDetail } from '$lib/types';
import { onMount } from 'svelte';

let solutionList: Solution[] = $state([]);
let fetchedDetails: Record<string, SolutionDetail> = {};

let isFetchingList: boolean = false;

export function initSolutionList() {
	onMount(async () => {
		// abort if already fetched or fetching (works if we're single threaded and not preempted)
		if (solutionList.length > 0 || isFetchingList) {
			return;
		}

		isFetchingList = true;
		solutionList = await fetchSolutions();
		isFetchingList = false;
	});
}

export function getSolutionList() {
	return solutionList;
}

export async function getSolutionDetail(name: string): Promise<SolutionDetail> {
	if (fetchedDetails[name]) {
		return fetchedDetails[name];
	}

	const detail = await fetchSolutionDetail(name);
	if (detail) {
		fetchedDetails[name] = detail;
	}
	return detail;
}

export function getActivatedSolution(
	solutionName: string,
	scenario: string,
	solutionDetail: SolutionDetail
): ActivatedSolution {
	return {
		solution_name: solutionName,
		scenario_name: scenario,
		detail: solutionDetail.scenarios[scenario],
		version: solutionDetail.version,
		objective: solutionDetail.objective
	};
}

export function generateScenarioYears(detail: ScenarioDetail): number[] {
	return [...Array(detail.system.optimized_years).keys()].map(
		(i) => i * detail.system.interval_between_years + detail.system.reference_year
	);
}
