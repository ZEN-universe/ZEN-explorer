import { PUBLIC_TEMPLE_URL } from "$env/static/public";
import type {
    Solution,
    Component,
    SolutionDetail,
    ActivatedSolution,
    ScenarioDetail,
} from "$lib/types";

export async function get_solutions(): Promise<Solution[]> {
    let solution_list: Array<Solution> = await (
        await fetch(PUBLIC_TEMPLE_URL + "solutions/list")
    ).json();
    return solution_list
}

export async function get_components(solution: string): Promise<Component[]> {
    let components = await (
        await fetch(
            PUBLIC_TEMPLE_URL + `solutions/${solution}/components`,
        )
    ).json();

    return components
}

export async function get_solution_detail(
    solution: string
): Promise<SolutionDetail> {
    let solution_detail = await (
        await fetch(
            PUBLIC_TEMPLE_URL + `solutions/get_detail/${solution}`,
        )
    ).json();

    return solution_detail
}