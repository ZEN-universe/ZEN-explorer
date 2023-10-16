from dash import Dash, html, dcc, callback, Output, Input
import plotly.express as px
import requests
from io import StringIO
import csv
import pandas as pd


solutions = requests.get("http://0.0.0.0:8000/solutions/list").json()
solution_names = [solution["name"] for solution in solutions]
solution_names.sort()
components = [
    "capacity",
    "flow_conversion_input",
    "flow_conversion_output"
]

tech_types = ["", "conversion", "storage_power", "storage_energy"]
carriers = ["", "electricity"]
app = Dash(__name__)

app.layout = html.Div(
    [
        html.H1("Solution name"),
        dcc.Dropdown(solution_names, "1_base_case", id="dropdown-selection"),
        html.H1("Component"),
        dcc.Dropdown(components, components[0], id="component-selection"),
        html.H1("Technology"),
        dcc.Dropdown(tech_types, "", id="technology-selection"),
        html.H1("Carrier"),
        dcc.Dropdown(carriers, "", id="carrier-selection"),
        html.H1("Result"),
        dcc.Graph(id="graph-content"),
    ]
)


@callback(
    Output("graph-content", "figure"),
    [
        Input("dropdown-selection", "value"),
        Input("component-selection", "value"),
        Input("technology-selection", "value"),
        Input("carrier-selection", "value"),
    ],
)
def update_graph(value: str, component: str, technology: str, carrier: str):
    request = {"component": component, "node_edit": "all", "yearly": True}

    if technology != "":
        request["tech_type"] = technology

    if carrier != "":
        request["reference_carrier"] = carrier

    res = requests.post(
        f"http://0.0.0.0:8000/solutions/{value}/df", json=request
    ).json()
    print(res)
    f = StringIO(res)
    reader = csv.reader(f, delimiter=",")
    rows: list[list] = [row for row in reader]

    full_df = pd.DataFrame(rows[1:], columns=rows[0])

    possible_colors = ["technology"]
    possible_shapes = ["location", "node"]

    color = set(full_df.columns).intersection(set(possible_colors)).pop()
    shape = set(full_df.columns).intersection(set(possible_shapes)).pop()

    fig = px.bar(
        full_df,
        x="year",
        y="value",
        title=value,
        color=color,
        pattern_shape=shape,
        orientation="v",
    )

    fig.update_xaxes(type="category")
    fig.update_yaxes(type="linear")
    return fig


if __name__ == "__main__":
    app.run(debug=True)
