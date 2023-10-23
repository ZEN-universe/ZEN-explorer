import dash  # type: ignore
from dash import Dash, html, dcc
import dash_bootstrap_components as dbc  # type: ignore

app = Dash(__name__, use_pages=True, external_stylesheets=[dbc.themes.BOOTSTRAP])

children = [
    dbc.NavLink(dcc.Link(f"{page['name']}", href=page["relative_path"]))
    for page in dash.page_registry.values()
]
navbar = dbc.NavbarSimple(
    children=[
        dbc.NavItem(dbc.NavLink(f"{page['name']}", href=page["relative_path"]))
        for page in dash.page_registry.values()
    ],
    id="nav",
    brand="Zen Explorer",
    brand_href="/",
    color="primary",
    dark=True,
)

app.layout = html.Div(
    [
        navbar,
        dash.page_container,
    ]
)

if __name__ == "__main__":
    app.run(debug=True)
