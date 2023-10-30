import dash  # type: ignore
from dash import html
import dash_bootstrap_components as dbc  # type: ignore
from config import config

dash.register_page(__name__, path="/")
layout = dbc.Container(
    [
        html.H1("Welcome to the ZEN Explorer", className="mt-5 mb-5"),
        dbc.ListGroup(
            [
                dbc.ListGroupItem(
                    "The Transition Pathway",
                    href=config.BASE_URL + "transition",
                    color="primary",
                ),
                dbc.ListGroupItem(
                    "The Energy Balance",
                    href=config.BASE_URL + "balance",
                    color="success",
                ),
            ],
            flush=True,
        ),
    ]
)
