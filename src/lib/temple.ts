import { env } from "$env/dynamic/public";
import Papa from 'papaparse';
import type {
    Solution,
    Component,
    ComponentTotal,
    SolutionDetail,
    EnergyBalanceDataframes,
    Row
} from "$lib/types";

export async function get_solutions(): Promise<Solution[]> {
    let solution_list: Array<Solution> = await (
        await fetch(env.PUBLIC_TEMPLE_URL + "solutions/list")
    ).json();
    return solution_list
}

export async function get_solution_detail(
    solution: string
): Promise<SolutionDetail> {
    let solution_detail = await (
        await fetch(
            env.PUBLIC_TEMPLE_URL + `solutions/get_detail/${solution}`,
        )
    ).json();

    return solution_detail
}

export async function get_energy_balance(
    solution: string, node: string, carrier: string, scenario: string, year: number
): Promise<EnergyBalanceDataframes> {
    let energy_balance_data = await (
        await fetch(
            env.PUBLIC_TEMPLE_URL + `solutions/get_energy_balance/${solution}/${node}/${carrier}?scenario=${scenario}&year=${year}`,
        )
    ).json();

    let series_names = [
        "demand",
        "flow_conversion_input",
        "flow_export",
        "flow_import",
        "flow_storage_charge",
        "flow_storage_discharge",
        "flow_transport_in",
        "flow_transport_out",
        "shed_demand",
        "flow_conversion_output"
    ]
    let ans: EnergyBalanceDataframes = {}

    for (const series_name of series_names) {
        if (energy_balance_data[series_name] !== undefined) {
            ans[series_name] = parse_csv(energy_balance_data[series_name])
        }
    }

    return ans
}

function parse_csv(data_csv: string, start_year: number = 0, step_year: number = 1) {

    let first_line = data_csv.slice(0, data_csv.indexOf("\n"));
    let headers = first_line.split(",")

    if (headers.lenth == 2) {
        let lines = data_csv.split("\n")
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

        data_csv = years.substring(0, years.length - 1) + "\n" + data.substring(0, data.length - 1)
    }

    function transform_year(h: string): string {
        if (!isNaN(Number(h))) {
            return String(Number(h) * step_year + start_year)
        }
        return h
    }
    let data: Papa.ParseResult<Row> = Papa.parse(data_csv, { delimiter: ",", header: true, newline: "\n", transformHeader: transform_year })
    return data
}

export async function get_component_total(
    solution_name: string,
    component_name: string,
    scenario_name: string,
    start_year: number = 0,
    step_year: number = 1,
    suffix: string[] | undefined = undefined): Promise<ComponentTotal> {

    const fetch_url = env.PUBLIC_TEMPLE_URL + `solutions/get_total/${solution_name}/${component_name}?scenario=${scenario_name}`

    console.log("Fetching", fetch_url)

    let component_data = await (
        await fetch(fetch_url)
    ).json();

    let data: Papa.ParseResult<Row> = parse_csv(component_data.data_csv, start_year, step_year)
    let unit: Papa.ParseResult<Row> | null = null

    if (component_data.unit) {
        unit = Papa.parse(component_data.unit, { delimiter: ",", header: true, newline: "\n" })
    }

    data.data = data.data.filter((row) => {
        for (const key in row) {
            let number_check = Number(key)
            if (!Number.isNaN(number_check) && !Number.isNaN(row[key]) && Math.abs(row[key]) > 0) {
                return true
            }
        }
        return false
    })

    const ans: ComponentTotal = {
        unit: unit,
        data: data
    }

    return ans
}
