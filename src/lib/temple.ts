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

    let unit: Papa.ParseResult<Row> | null = null

    if (component_data.unit) {
        unit = Papa.parse(component_data.unit, { delimiter: ",", header: true, newline: "\n" })
    }

    const ans: ComponentTotal = {
        unit: unit,
        data: data
    }

    return ans
}
