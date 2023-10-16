from dash import Dash, html, dcc, callback, Output, Input
import plotly.express as px
import requests
from io import StringIO
import csv
from natsort import natsorted
import pandas as pd
import dash_bootstrap_components as dbc
from typing import Optional


solutions = requests.get("http://0.0.0.0:8000/solutions/list").json()
solution_names = [solution["name"] for solution in solutions]
solution_names = natsorted(solution_names)
components = [
    "capacity",
    "flow_conversion_input",
    "flow_conversion_output",
    "flow_import",
    "flow_export",
    "cost_carrier",
    "capacity_addition",
    "carbon_emissions_carrier",
]

app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

filters = dbc.Card(
    [
        html.Div(
            [
                dbc.Label(
                    "Component",
                ),
                dcc.Dropdown(
                    components, components[0], id="component-selection", clearable=False
                ),
            ]
        ),
        html.Div(
            [
                dbc.Label("Scenario"),
                dcc.Dropdown([], id="scenario-selection", clearable=False),
            ],
            className="mt-3",
        ),
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
            ]
        ),
        html.Hr(),
        dbc.Row(
            [
                dbc.Col(filters, md=3),
                dbc.Col(dcc.Graph(id="graph-content"), md=9),
            ]
        ),
    ]
)


@callback(
    [
        Output("scenario-selection", "options"),
        Output("technology-selection", "options"),
        Output("carrier-selection", "options"),
        Output("node-selection", "options"),
        Output("scenario-selection", "disabled"),
    ],
    Input("solution-selection", "value"),
)
def update_scenarios(solution):
    index = [i["name"] for i in solutions].index(solution)
    current_scenario = solutions[index]
    scenarios = list(current_scenario["scenarios"])
    # technologies = list(current_scenario["technologies"])
    technologies = ["conversion", "transport", "storage"]
    carriers = list(current_scenario["carriers"])
    nodes = list(current_scenario["nodes"])
    return scenarios, technologies, carriers, nodes, scenarios == [""]


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
)
def update_graph(
    value: str,
    component: str,
    technology: Optional[str],
    carrier: Optional[str],
    scenario: Optional[str],
    node: Optional[str],
):
    request = {
        "component": component,
        "node_edit": node if node is not None else "all",
        "yearly": True,
        "scenario": scenario,
        "tech_type": technology,
        "reference_carrier": carrier,
    }

    res = requests.post(
        f"http://0.0.0.0:8000/solutions/{value}/df", json=request
    ).json()

    f = StringIO(res)
    reader = csv.reader(f, delimiter=",")
    rows: list[list] = [row for row in reader]
    print(rows)
    full_df = pd.DataFrame(rows[1:], columns=rows[0])

    possible_colors = ["technology", "carrier"]
    possible_shapes = ["location", "node"]

    color_list = list(set(full_df.columns).intersection(set(possible_colors)))
    shape_list = list(set(full_df.columns).intersection(set(possible_shapes)))
    kwargs = {}

    if len(color_list) > 0:
        kwargs["color"] = color_list[0]

    if len(shape_list) > 0:
        kwargs["pattern_shape"] = shape_list[0]

    fig = px.bar(full_df, x="year", y="value", orientation="v", **kwargs)

    fig.update_xaxes(type="category")
    fig.update_yaxes(type="linear")
    return fig


if __name__ == "__main__":
    app.run(debug=True)
