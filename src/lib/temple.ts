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
    const fetch_url = PUBLIC_TEMPLE_URL + `solutions/get_total/${solution_name}/${component_name}?scenario=${scenario_name}`

    console.log("Fetching", fetch_url)

    let component_data = await (
        await fetch(fetch_url)
    ).json();

    console.log("Fetched.")

    let first_line = component_data.data_csv.slice(0, component_data.data_csv.indexOf("\n"));
    let headers = first_line.split(",")

    if (headers.length == 2) {
        let lines = component_data.data_csv.split("\n")
        let years = ""
        let data = ""

        for (const line of lines.slice(1, lines.length)) {
            if (line == "") {
                continue
            }

            let line_split = line.split(",")
            years += line_split[0] + ","
            data += line_split[1] + ","
        }

        component_data.data_csv = years.substring(0, years.length - 1) + "\n" + data.substring(0, data.length - 1)
    }

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
    console.log(data.data.length, "datapoints fetched")
    data.data = data.data.filter((row) => {
        for (const key in row) {
            let number_check = Number(key)
            if (!Number.isNaN(number_check) && !Number.isNaN(row[key]) && Math.abs(row[key]) > 0) {
                return true
            }
        }
        return false
    })
    console.log(data.data.length, "datapoints after filtering zero values.")

    const ans: ComponentTotal = {
        unit: unit,
        data: data
    }

    return ans
}
