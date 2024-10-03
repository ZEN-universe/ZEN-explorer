const versions = {
    0: {},
    1: {
        capex_yearly: "cost_capex_yearly",
        opex_yearly: "cost_opex_yearly",
        cost_opex_total: "cost_opex_yearly_total",
        cost_opex: "cost_opex_variable",
        cost_capex_total: "cost_capex_yearly_total",
        cost_capex: "cost_capex_overnight"
    }
}

export function get_variable_name(name: string, version: number = 1) {
    if (version in versions) {
        if (name in versions[version]) {
            return versions[version][name]
        }
    }
    return name
}