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

sum_over_nodes_str = "Sum over all nodes"
time_name = "time_step"
location_names = ["location", "node"]

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
                            value="",
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
                html.Div(
                    [
                        dbc.Label("Location"),
                        dcc.Dropdown([], id="node-selection"),
                    ],
                    className="mt-3",
                ),
            ]
        ),
        html.Hr(),
        dbc.Row(
            [
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
    has_scenarios = len(scenarios) > 1
    scenarios = [""] if not has_scenarios else scenarios

    return scenarios, len(scenarios) == 1, None, scenarios[0]


@callback(
    Output("available-components", "data"),
    [Input("solution-selection", "value"), Input("scenario-selection", "value")],
)  # type: ignore
def activate_components(solution_name: str, scenario_name: Optional[str]):
    if solution_name is None:
        raise PreventUpdate

    if scenario_name in [None, ""]:
        scenario_name = "null"

    data = requests.get(server_url + f"solutions/{solution_name}/components")

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
        Output("node-selection", "value"),
        Output("node-selection", "options"),
        Output("node-selection", "disabled"),
    ],
    [Input("component-selection", "value"), Input("available-components", "data")],
)  # type: ignore
def update_active_component(component: str, available_components: dict[Any, Any]):
    if available_components is None:
        raise PreventUpdate

    component_names = [i["component_name"] for i in available_components]

    if component not in component_names:
        return "", [], True

    current_component = available_components[component_names.index(component)]
    nodes_level = [i for i in current_component["levels"] if i["title"] == "node"]
    node = nodes_level[0] if len(nodes_level) > 0 else None
    node_names = node["names"] if node is not None else []
    node_value = sum_over_nodes_str if node is not None else ""
    node_options = [sum_over_nodes_str] + node_names if node is not None else []
    return (
        node_value,
        node_options,
        len(nodes_level) == 0,
    )


@callback(
    Output("graph-content", "figure"),
    [
        Input("solution-selection", "value"),
        Input("component-selection", "value"),
        Input("scenario-selection", "value"),
        Input("node-selection", "value"),
        Input("available-components", "data"),
    ],
)  # type: ignore
def update_graph(
    solution: Optional[str],
    component: Optional[str],
    scenario: Optional[str],
    node: str,
    components: list[dict[str, Any]],
):
    if solution is None:
        return get_empty_plot("Select a solution")

    if scenario is None:
        return get_empty_plot("Select a Scenario")

    if component is None:
        return get_empty_plot("Select a Component")

    start = perf_counter()

    try:
        url = f"{server_url}solutions/get_total/{solution}/{component}"
        if scenario != "":
            url += f"/?scenario={scenario}"
        result = requests.get(url)
    except Exception:
        return get_empty_plot("Cannot process request")

    duration = perf_counter() - start

    if result.status_code == 413:
        return get_empty_plot("Too many data points. Consider adding some filter.")

    res = result.json()

    f = StringIO(res)
    full_df = pd.read_csv(f, header=0, index_col=None)

    if len(full_df) <= 1:
        return get_empty_plot("No data to plot.")

    active_component = [i for i in components if i["component_name"] == component][0]

    possible_plot_dimensions: list[str] = ["color", "pattern_shape"]

    has_nodes = (
        len([i for i in active_component["levels"] if i["title"] in location_names]) > 0
    )

    if has_nodes:
        final_df = summarize_df_by_node(full_df, node)
    else:
        final_df = full_df.rename(
            columns={"year": time_name, full_df.columns[-1]: "value"}
        )

    possible_columns = [i for i in final_df.columns if i not in [time_name, "value"]]

    kwargs: dict[str, str] = {}

    for k, keyword in enumerate(possible_plot_dimensions):
        try:
            kwargs[keyword] = possible_columns[k]
        except IndexError:
            break

    fig = px.bar(final_df, x=time_name, y="value", orientation="v", **kwargs)
    fig.update_xaxes(type="linear", title="Year")
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


def summarize_df_by_node(df: pd.DataFrame, node: str) -> pd.DataFrame:
    index_names: list[str] = []
    timestep_names = []

    for j in df.columns:
        try:
            timestep_names.append(int(j))
        except ValueError:
            index_names.append(j)

    # full_df = full_df.reset_index().set_index(index_names).drop("index", axis=1)

    melted_df = pd.melt(df, id_vars=index_names, var_name=time_name)

    if node == sum_over_nodes_str:
        non_location_index = [i for i in index_names if i not in location_names] + [
            time_name
        ]

        melted_df = (
            melted_df.groupby(non_location_index)["value"]
            .sum()
            .to_frame()
            .reset_index()
        )
    else:
        current_location_name = [i for i in melted_df.columns if i in location_names]
        locations = (melted_df[current_location_name] == node).squeeze()
        melted_df = melted_df.loc[locations]

    return melted_df
