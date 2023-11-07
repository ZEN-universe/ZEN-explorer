from dash import html, dcc, callback, Output, Input  # type: ignore
import plotly.express as px  # type: ignore
import requests
from io import StringIO
from natsort import natsorted
import pandas as pd
import dash_bootstrap_components as dbc  # type: ignore
from typing import Optional, Any
from time import perf_counter
import dash  # type: ignore
from dash.exceptions import PreventUpdate  # type: ignore
from config import config


server_url = config.TEMPLE_URL

dash.register_page(__name__, path="/transition")


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
                dcc.Dropdown([], id="technology-selection"),
            ],
            className="mt-3",
        ),
        html.Div(
            [dbc.Label("Carrier"), dcc.Dropdown([], id="carrier-selection")],
            className="mt-3",
        ),
        html.Div(
            [
                dbc.Label("Node"),
                dcc.Dropdown([], id="node-selection"),
            ],
            className="mt-3",
        ),
        html.Div(id="time", className="mt-3"),
    ],
    body=True,
)

layout = dbc.Container(
    [
        html.H1("The Transition Pathway", className="mt-5"),
        html.Div(id="loader"),
        html.Div(
            [
                dbc.Label("Select the solution"),
                dcc.Dropdown(
                    [],
                    id="solution-selection",
                    clearable=False,
                ),
                html.Div(
                    [
                        dbc.Label("Scenario"),
                        dcc.Dropdown(
                            [],
                            id="scenario-selection",
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
                            id="component-selection",
                            clearable=False,
                            disabled=True,
                        ),
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
                        children=dcc.Graph(id="graph-content"),
                    )
                ),
            ]
        ),
        dcc.Store(id="solution-list"),
        dcc.Store(id="available-components"),
        dcc.Store(id="component-details"),
    ]
)


@callback(
    [Output("solution-list", "data"), Output("solution-selection", "options")],
    Input("loader", "children"),
)  # type: ignore
def test(a):
    solutions = requests.get(server_url + "solutions/list").json()
    solution_names = [solution["name"] for solution in solutions]
    solution_names = natsorted(solution_names)
    return solutions, solution_names


@callback(
    [
        Output("scenario-selection", "options"),
        Output("scenario-selection", "disabled"),
        Output("component-selection", "value"),
        Output("scenario-selection", "value"),
    ],
    [Input("solution-list", "data"), Input("solution-selection", "value")],
)  # type: ignore
def activate_solution(solutions: dict[Any, Any], solution: str):
    if solution is None:
        raise PreventUpdate

    index = [i["name"] for i in solutions].index(solution)
    current_soultion = solutions[index]
    scenarios = natsorted(list(current_soultion["scenarios"]))
    return scenarios, len(scenarios) == 1, None, scenarios[0]


@callback(
    Output("available-components", "data"),
    [Input("solution-selection", "value"), Input("scenario-selection", "value")],
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
        Output("component-selection", "options"),
        Output("component-selection", "disabled"),
    ],
    Input("available-components", "data"),
)  # type: ignore
def update_components_options(available_components):
    components = [i["component_name"] for i in available_components]
    return components, len(components) == 0


@callback(
    [
        Output("component-details", "data"),
        Output("technology-selection", "value"),
        Output("carrier-selection", "value"),
        Output("node-selection", "value"),
    ],
    [Input("component-selection", "value"), Input("available-components", "data")],
)  # type: ignore
def update_active_component(component: str, available_components: dict[Any, Any]):
    if available_components is None:
        raise PreventUpdate

    component_names = [i["component_name"] for i in available_components]
    if component not in component_names:
        return {}, None, None, None
    outputs = [available_components[component_names.index(component)]] + 3 * [None]
    return tuple(outputs)


@callback(
    [
        Output("technology-selection", "options"),
        Output("carrier-selection", "options"),
        Output("node-selection", "options"),
        Output("technology-selection", "disabled"),
        Output("carrier-selection", "disabled"),
        Output("node-selection", "disabled"),
    ],
    Input("component-details", "data"),
)  # type: ignore
def update_options(component_detail: dict[Any, Any]):
    option_tuples: list[tuple[str, list[str]]] = [
        ("technology", []),
        ("carrier", []),
        ("node", []),
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
    Output("graph-content", "figure"),
    [
        Input("solution-selection", "value"),
        Input("component-selection", "value"),
        Input("technology-selection", "value"),
        Input("carrier-selection", "value"),
        Input("scenario-selection", "value"),
        Input("node-selection", "value"),
    ],
)  # type: ignore
def update_graph(
    solution: Optional[str],
    component: Optional[str],
    technology: Optional[str],
    carrier: Optional[str],
    scenario: Optional[str],
    node: Optional[str],
):
    if solution is None:
        return get_empty_plot("Select a solution")

    if scenario is None:
        return get_empty_plot("Select a Scenario")

    if component is None:
        return get_empty_plot("Select a Component")

    index_sets = []

    level_tuples = [("technology", technology), ("carrier", carrier), ("node", node)]

    for i in level_tuples:
        if i[1] is not None:
            index_sets.append(
                {"behaviour": "sum", "index_title": i[0], "indices": [i[1]]}
            )

    request = {
        "aggregate_years": True,
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
    full_df = pd.read_csv(f, header=0)

    if len(full_df) <= 1:
        return get_empty_plot("No data to plot.")

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

    time_name = "time_step"

    fig = px.bar(full_df, x=time_name, y="value", orientation="v", **kwargs)

    fig.update_xaxes(type="category", title="Year")
    fig.update_yaxes(type="linear")

    fig.add_annotation(
        text=f"rt: {1000*duration:.1f}ms, n_values: {len(full_df)-1}",
        xref="paper",
        yref="paper",
        x=0.999,
        y=0.999,
        showarrow=False,
    )
    return fig
