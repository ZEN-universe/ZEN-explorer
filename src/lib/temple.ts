import { PUBLIC_TEMPLE_URL } from "$env/static/public";
import Papa from 'papaparse';
import type {
    Solution,
    Component,
    ComponentTotal,
    SolutionDetail,
    Row
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

export async function get_component_total(solution_name: string, component_name: string, scenario_name: string, start_year: number = 0, step_year: number = 1): Promise<ComponentTotal> {
    let component_data = await (
        await fetch(
            PUBLIC_TEMPLE_URL + `solutions/get_total/${solution_name}/${component_name}?scenario=${scenario_name}`,
        )
    ).json();
    
    function transform_year(h: string): string {
        if (!isNaN(Number(h))) {
            return String(Number(h) * step_year + start_year)
        }
        return h
    }
    let data: Papa.ParseResult<Row> = Papa.parse(component_data.data_csv, { delimiter: ",", header: true, newline: "\n", transformHeader: transform_year })

    const ans: ComponentTotal = {
        unit: component_data.unit,
        data: data
    }

    return ans
}
