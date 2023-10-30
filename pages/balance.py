from dash import html, dcc, callback, Output, Input  # type: ignore
import plotly.express as px  # type: ignore
import requests
from io import StringIO
import csv
from natsort import natsorted
import pandas as pd
import dash_bootstrap_components as dbc  # type: ignore
from typing import Optional, Any
from time import perf_counter
import dash  # type: ignore
from dash.exceptions import PreventUpdate  # type: ignore
from config import config


server_url = config.TEMPLE_URL

dash.register_page(__name__, path="/balance")

sum_string = "Sum over all nodes"


def get_empty_plot(message: str) -> dict[Any, Any]:
    return {
        "layout": {
            "xaxis": {"visible": False},
            "yaxis": {"visible": False},
            "annotations": [
                {
                    "text": message,
                    "xref": "paper",
                    "yref": "paper",
                    "showarrow": False,
                    "font": {"size": 28},
                }
            ],
        }
    }


filters = dbc.Card(
    [
        html.Div(
            [
                dbc.Label("Technology"),
                dcc.Dropdown([], id="balance-technology-selection"),
            ],
            className="mt-3",
        ),
        html.Div(
            [dbc.Label("Carrier"), dcc.Dropdown([], id="balance-carrier-selection")],
            className="mt-3",
        ),
        html.Div(id="time", className="mt-3"),
    ],
    body=True,
)

layout = dbc.Container(
    [
        html.H1("The Energy Balance", className="mt-5"),
        html.Div(id="balance-loader"),
        html.Div(id="balance-js"),
        html.Div(
            [
                dbc.Label("Select the solution"),
                dcc.Dropdown(
                    [],
                    id="balance-solution-selection",
                    clearable=False,
                ),
                html.Div(
                    [
                        dbc.Label("Scenario"),
                        dcc.Dropdown(
                            [],
                            id="balance-scenario-selection",
                            value="scenario_",
                            clearable=False,
                        ),
                    ],
                    className="mt-3",
                ),
                html.Div(
                    [
                        dbc.Label(
                            "Component",
                        ),
                        dcc.Dropdown(
                            ["cost_carrier"],
                            "cost_carrier",
                            id="balance-component-selection",
                            clearable=False,
                            disabled=True,
                        ),
                    ],
                    className="mt-3",
                ),
                html.Div(
                    [
                        dbc.Label("Node"),
                        dcc.Dropdown([], value=sum_string, id="balance-node-selection"),
                    ],
                    className="mt-3",
                ),
            ]
        ),
        html.Hr(),
        dbc.Row(
            [
                dbc.Col(filters, md=3),
                dbc.Col(
                    dcc.Loading(
                        id="loading-1",
                        type="default",
                        children=dcc.Graph(id="balance-graph-content"),
                    ),
                ),
            ]
        ),
        dcc.Store(id="balance-solution-list"),
        dcc.Store(id="balance-available-components"),
        dcc.Store(id="balance-component-details"),
    ]
)


@callback(
    [
        Output("balance-solution-list", "data"),
        Output("balance-solution-selection", "options"),
    ],
    Input("balance-loader", "children"),
)  # type: ignore
def test(a):
    solutions = requests.get(server_url + "solutions/list").json()
    solution_names = [solution["name"] for solution in solutions]
    solution_names = natsorted(solution_names)
    return solutions, solution_names


@callback(
    [
        Output("balance-scenario-selection", "options"),
        Output("balance-scenario-selection", "disabled"),
        Output("balance-component-selection", "value"),
        Output("balance-scenario-selection", "value"),
    ],
    [
        Input("balance-solution-list", "data"),
        Input("balance-solution-selection", "value"),
    ],
)  # type: ignore
def activate_solution(solutions: dict[Any, Any], solution: str):
    if solution is None:
        raise PreventUpdate

    index = [i["name"] for i in solutions].index(solution)
    current_soultion = solutions[index]
    scenarios = natsorted(list(current_soultion["scenarios"]))
    return scenarios, len(scenarios) == 1, None, scenarios[0]


@callback(
    Output("balance-available-components", "data"),
    [
        Input("balance-solution-selection", "value"),
        Input("balance-scenario-selection", "value"),
    ],
)  # type: ignore
def activate_components(solution_name: str, scenario_name: Optional[str]):
    if solution_name is None:
        raise PreventUpdate

    if scenario_name is None:
        scenario_name = "scenario_"

    data = requests.get(
        server_url + f"solutions/{solution_name}/{scenario_name}/components"
    )

    return data.json()


@callback(
    [
        Output("balance-component-selection", "options"),
        Output("balance-component-selection", "disabled"),
    ],
    Input("balance-available-components", "data"),
)  # type: ignore
def update_components_options(available_components):
    components = [i["component_name"] for i in available_components if not i["yearly"]]
    return components, len(components) == 0


@callback(
    [
        Output("balance-component-details", "data"),
        Output("balance-technology-selection", "value"),
        Output("balance-carrier-selection", "value"),
        Output("balance-node-selection", "value"),
    ],
    [
        Input("balance-component-selection", "value"),
        Input("balance-available-components", "data"),
    ],
)  # type: ignore
def update_active_component(component: str, available_components: dict[Any, Any]):
    if available_components is None:
        raise PreventUpdate

    component_names = [i["component_name"] for i in available_components]

    if component not in component_names:
        return {}, None, None, None

    outputs = [available_components[component_names.index(component)]] + [
        None,
        None,
        sum_string,
    ]
    return tuple(outputs)


@callback(
    [
        Output("balance-technology-selection", "options"),
        Output("balance-carrier-selection", "options"),
        Output("balance-node-selection", "options"),
        Output("balance-technology-selection", "disabled"),
        Output("balance-carrier-selection", "disabled"),
        Output("balance-node-selection", "disabled"),
    ],
    Input("balance-component-details", "data"),
)  # type: ignore
def update_options(component_detail: dict[Any, Any]):
    option_tuples: list[tuple[str, list[str]]] = [
        ("technology", []),
        ("carrier", []),
        ("node", [sum_string]),
    ]
    if component_detail is None:
        return 3 * [[]] + 3 * [True]
    if "levels" not in component_detail:
        return [[]] * len(option_tuples) + [True] * len(option_tuples)

    level_titles = [i["title"] for i in component_detail["levels"]]

    for option_tuple in option_tuples:
        if option_tuple[0] in level_titles:
            index = level_titles.index(option_tuple[0])
            for i in component_detail["levels"][index]["names"]:
                option_tuple[1].append(i)

    ans = [i[1] for i in option_tuples] + [len(i[1]) == 0 for i in option_tuples]
    return tuple(ans)


@callback(
    Output("balance-graph-content", "figure"),
    [
        Input("balance-solution-selection", "value"),
        Input("balance-component-selection", "value"),
        Input("balance-technology-selection", "value"),
        Input("balance-carrier-selection", "value"),
        Input("balance-scenario-selection", "value"),
        Input("balance-node-selection", "value"),
        Input("balance-component-details", "data"),
    ],
)  # type: ignore
def update_graph(
    solution: Optional[str],
    component: Optional[str],
    technology: Optional[str],
    carrier: Optional[str],
    scenario: Optional[str],
    node: Optional[str],
    details: Optional[dict[str, Any]],
):
    if solution is None:
        return get_empty_plot("Select a solution")

    if scenario is None:
        return get_empty_plot("Select a Scenario")

    if component is None:
        return get_empty_plot("Select a Component")

    if details is None:
        return get_empty_plot("No data found.")

    index_sets = []

    level_tuples = [("technology", technology), ("carrier", carrier), ("node", node)]

    for i in level_tuples:
        if i[1] is not None:
            current: dict[str, list[str] | str] = {
                "behaviour": "sum",
                "index_title": i[0],
            }
            if i[1] != sum_string:
                current["indices"] = [i[1]]

            index_sets.append(current)

    request = {
        "aggregate_years": False,
        "scenario": scenario,
        "solution_name": solution,
        "component": component,
        "data_request": {"default": "series", "index_sets": index_sets},
    }

    start = perf_counter()

    try:
        result = requests.post(f"{server_url}solutions/get_data", json=request)
    except Exception:
        return get_empty_plot("Cannot process request")

    duration = perf_counter() - start

    if result.status_code == 413:
        return get_empty_plot("Too many data points. Consider adding some filter.")

    res = result.json()
    f = StringIO(res)
    reader = csv.reader(f, delimiter=",")
    rows: list[list[Any]] = [row for row in reader]

    if len(rows) <= 1:
        return get_empty_plot("No data to plot.")

    full_df = pd.DataFrame(rows[1:], columns=rows[0])
    possible_levels: list[str] = [
        i for i in ["technology", "node", "carrier"] if i in full_df.columns
    ]

    possible_plot_dimensions: list[str] = ["color", "pattern_shape"]

    kwargs: dict[str, str] = {}

    for k, keyword in enumerate(possible_plot_dimensions):
        try:
            kwargs[keyword] = possible_levels[k]
        except IndexError:
            break

    time_name = "year" if "year" in full_df.columns else "time_step"

    fig = px.area(full_df, x=time_name, y="value", orientation="v", **kwargs)

    n_timesteps_per_year = details["aggregated_time_steps_per_year"]
    tickvals = [i for i in range(len(rows) - 1) if i % n_timesteps_per_year == 0]

    fig.update_xaxes(
        type="category",
        autorange=False,
        fixedrange=True,
        tickvals=tickvals,
        ticktext=[str(int(i / n_timesteps_per_year)) for i in tickvals],
        title="Year",
        range=[0, n_timesteps_per_year],
        rangeslider=dict(visible=True, thickness=0.1),
    )
    fig.update_yaxes(type="linear", fixedrange=True)

    fig.add_annotation(
        text=f"rt: {1000*duration:.1f}ms, n_values: {len(rows)-1}",
        xref="paper",
        yref="paper",
        x=0.999,
        y=0.999,
        showarrow=False,
    )

    return fig
