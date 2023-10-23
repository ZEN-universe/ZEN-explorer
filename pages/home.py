import dash  # type: ignore
from dash import html
import dash_bootstrap_components as dbc  # type: ignore

dash.register_page(__name__, path="/")
layout = dbc.Container(
    [
        html.H1("Welcome to the ZEN Explorer", className="mt-5"),
    ]
)
