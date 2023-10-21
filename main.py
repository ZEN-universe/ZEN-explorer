from dash import Dash, html, dcc, callback, Output, Input  # type: ignore
import plotly.express as px  # type: ignore
import requests
from io import StringIO
import csv
from natsort import natsorted
import pandas as pd
import dash_bootstrap_components as dbc  # type: ignore
from typing import Optional, Any
from time import perf_counter


server_url = "http://0.0.0.0:8000/"
solutions = requests.get(server_url + "solutions/list").json()
solution_names = [solution["name"] for solution in solutions]
solution_names = natsorted(solution_names)


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


app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

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

app.layout = dbc.Container(
    [
        html.H1("ZEN Explorer", className="mt-5"),
        html.Div(
            [
                dbc.Label("Select the solution"),
                dcc.Dropdown(
                    solution_names,
                    "1_base_case",
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
                            [],
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
                dbc.Col(dcc.Graph(id="graph-content"), md=9),
            ]
        ),
        dcc.Store(id="available-components"),
        dcc.Store(id="component-details"),
    ]
)


@callback(
    [
        Output("scenario-selection", "options"),
        Output("scenario-selection", "disabled"),
        Output("component-selection", "value"),
    ],
    Input("solution-selection", "value"),
)  # type: ignore
def activate_solution(solution: str):
    index = [i["name"] for i in solutions].index(solution)
    current_scenario = solutions[index]
    scenarios = list(current_scenario["scenarios"])
    return scenarios, len(scenarios) == 1, None


@callback(
    Output("available-components", "data"),
    [Input("solution-selection", "value"), Input("scenario-selection", "value")],
)  # type: ignore
def activate_components(solution_name: str, scenario_name: Optional[str]):
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
    Output("component-details", "data"),
    [Input("component-selection", "value"), Input("available-components", "data")],
)  # type: ignore
def update_active_component(component: str, available_components: dict[Any, Any]):
    component_names = [i["component_name"] for i in available_components]
    if component not in component_names:
        return {}
    return available_components[component_names.index(component)]


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
    option_tuples = [("technology", []), ("carrier", []), ("node", [])]
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
                {"behaviour": "series", "index_title": i[0], "indices": [i[1]]}
            )

    request = {
        "scenario": scenario,
        "solution_name": solution,
        "component": component,
        "data_request": {"default": "series", "index_sets": index_sets},
    }
    print(request)
    start = perf_counter()
    try:
        res = requests.post(
            f"http://0.0.0.0:8000/solutions/get_data", json=request
        ).json()

    except Exception:
        return get_empty_plot("Cannot process request")

    duration = perf_counter() - start

    f = StringIO(res)
    reader = csv.reader(f, delimiter=",")
    rows: list[list[Any]] = [row for row in reader]
    print(len(rows), len(rows[1]), len(rows) * len(rows[1]))

    if len(rows) <= 1:
        return get_empty_plot("No data to plot.")

    full_df = pd.DataFrame(rows[1:], columns=rows[0])

    possible_colors = ["technology", "carrier"]
    possible_shapes = ["location", "node"]

    color_list = list(set(full_df.columns).intersection(set(possible_colors)))
    shape_list = list(set(full_df.columns).intersection(set(possible_shapes)))
    time_name = "year" if "year" in full_df.columns else "time_step"
    kwargs = {}

    if len(color_list) > 0:
        kwargs["color"] = color_list[0]

    if len(shape_list) > 0:
        kwargs["pattern_shape"] = shape_list[0]

    fig = px.bar(full_df, x=time_name, y="value", orientation="v", **kwargs)

    fig.update_xaxes(type="category")
    fig.update_yaxes(type="linear")

    fig.add_annotation(
        text=f"Server response time: {duration:.4f}s",
        xref="paper",
        yref="paper",
        x=0.999,
        y=0.999,
        showarrow=False,
    )
    return fig


if __name__ == "__main__":
    app.run(debug=True)
