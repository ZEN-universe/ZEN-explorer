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
import plotly.graph_objects as go  # type: ignore


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
                            clearable=False,
                        ),
                    ],
                    className="mt-3",
                ),
                html.Div(
                    [
                        dbc.Label(
                            "Carrier",
                        ),
                        dcc.Dropdown(
                            [],
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
                        dcc.Dropdown([], id="balance-node-selection"),
                    ],
                    className="mt-3",
                ),
                html.Div(
                    [
                        dbc.Label("Year"),
                        dcc.Dropdown([], id="balance-year-selection"),
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
                        children=dcc.Graph(id="balance-graph-content"),
                    ),
                ),
            ]
        ),
        dcc.Store(id="balance-solution-list"),
        dcc.Store(id="balance-available-components"),
        dcc.Store(id="balance-component-details"),
        dcc.Store(id="balance-current-solution"),
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
        Output("balance-component-selection", "options"),
        Output("balance-component-selection", "disabled"),
        Output("balance-node-selection", "options"),
        Output("balance-node-selection", "disabled"),
        Output("balance-node-selection", "value"),
        Output("balance-current-solution", "data"),
        Output("balance-year-selection", "options"),
        Output("balance-year-selection", "value"),
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
    years = list(range(current_soultion["optimized_years"]))
    return (
        scenarios,
        len(scenarios) == 1,
        None,
        scenarios[0] if len(scenarios) > 1 else None,
        current_soultion["carriers"],
        len(current_soultion["carriers"]) == 0,
        current_soultion["nodes"],
        len(current_soultion["nodes"]) == 0,
        None,
        current_soultion,
        years,
        None,
    )


@callback(
    Output("balance-graph-content", "figure"),
    [
        Input("balance-solution-selection", "value"),
        Input("balance-component-selection", "value"),
        Input("balance-scenario-selection", "value"),
        Input("balance-node-selection", "value"),
        Input("balance-year-selection", "value"),
        Input("balance-current-solution", "data"),
    ],
)  # type: ignore
def update_graph(
    solution: Optional[str],
    carrier: Optional[str],
    scenario: Optional[str],
    node: Optional[str],
    year: Optional[int],
    current_solution: dict[str, Any],
):
    if solution is None:
        return get_empty_plot("Select a solution")

    if carrier is None:
        return get_empty_plot("Select a Carrier")

    if node is None:
        return get_empty_plot("Select a Node")

    if year is None:
        return get_empty_plot("Select a year")

    start = perf_counter()
    try:
        url = f"{server_url}solutions/get_energy_balance/{solution}/{node}/{carrier}/?year={year}"  # noqa
        if scenario is not None:
            url += f"scenario={scenario}"
        result = requests.get(url)

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
    full_df = pd.melt(full_df, id_vars=["variable", "technology"], var_name="time_step")

    non_demand_df = full_df[(full_df["variable"] != "demand")]
    demand_df = full_df[full_df["variable"] == "demand"]
    positive_df = non_demand_df[non_demand_df["value"] >= 0]
    negative_df = non_demand_df[non_demand_df["value"] < 0]

    line_dataframes = {"negative": negative_df, "positive": positive_df}
    fig = go.Figure()
    fig.update_yaxes(type="linear")
    for stackgroup, df in line_dataframes.items():
        for variable in df["variable"].unique():
            for technology in df["technology"].unique():
                current_df = df.loc[
                    (df["technology"] == technology) & (df["variable"] == variable)
                ]
                fig.add_trace(
                    go.Scatter(
                        x=current_df["time_step"],
                        y=current_df["value"],
                        fill="tozeroy",
                        name=f"{technology}: {variable}",
                        stackgroup=stackgroup
                    )
                )

    demand_trace = go.Scatter(
        x=demand_df["time_step"],
        y=demand_df["value"],
        name="demand",
        marker=dict(color="black"),
    )

    fig.add_trace(demand_trace)

    n_timesteps_per_year = current_solution["total_hours_per_year"]
    tickvals = [i for i in range(len(full_df) - 1) if i % n_timesteps_per_year == 0]

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
        text=f"rt: {1000*duration:.1f}ms, n_values: {len(full_df)-1}",
        xref="paper",
        yref="paper",
        x=0.999,
        y=0.999,
        showarrow=False,
    )

    return fig
