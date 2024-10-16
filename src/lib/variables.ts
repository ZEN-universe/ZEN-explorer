
interface NameMap {
    [key: string]: string
}

interface Versions {
    [key: string]: NameMap
}


const versions: Versions = {
    "1.9.0": {
        capex_yearly: "cost_capex_yearly",
        opex_yearly: "cost_opex_yearly",
        cost_opex_total: "cost_opex_yearly_total",
        cost_opex: "cost_opex_variable",
        cost_capex_total: "cost_capex_yearly_total",
        cost_capex: "cost_capex_overnight"
    }
}

function smaller_than(version_a: string, version_b: string) {
    let split_a = version_a.split(".")
    let split_b = version_b.split(".")

    for (let i = 0; i < 3; i++) {

        if (Number(split_a[i]) > Number(split_b[i])) {
            return false
        }
    }
    return true
}

export function get_variable_name(name: string, version: string = "0.0.0") {
    let current_version: string | null = null;
    console.log("Looking for", name, "at version", version)
    for (let defined_version of Object.keys(versions)) {
        if (smaller_than(defined_version, version)) {
            current_version = defined_version
        }
    }
    console.log("taking", current_version)
    let real_name: string;
    if (current_version === null || !(name in versions[current_version])) {
        real_name = name
    } else {
        real_name = versions[current_version][name]
    }
    console.log("real name", real_name)
    return real_name
}