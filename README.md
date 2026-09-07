# ZEN-explorer

ZEN-explorer is the frontend of the [ZEN-garden](https://github.com/ZEN-universe/ZEN-garden) visualization platform. It uses the endpoints provided by its web service [ZEN-temple](https://github.com/ZEN-universe/ZEN-temple) to fetch data of the provided solutions and visualize them.

[![Linter](https://github.com/ZEN-universe/ZEN-explorer/actions/workflows/linter.yml/badge.svg)](https://github.com/ZEN-universe/ZEN-explorer/actions/workflows/linter.yml)

## 🧭 Which setup do I need?

ZEN-explorer is the **frontend**. It always needs a running **ZEN-temple** API
(the backend) to fetch data from.

| Your goal                                          | Follow                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Just visualize solutions** (no coding)          | [ZEN-temple → Quick start](https://github.com/ZEN-universe/ZEN-temple#-quick-start). ZEN-explorer ships inside the released `zen-temple` package. |
| **Develop ZEN-explorer** (this repo)              | [Development](#-development) below – run this repo's dev server plus a ZEN-temple API.                    |
| **Develop only ZEN-temple** (the backend)         | [ZEN-temple → Backend development](https://github.com/ZEN-universe/ZEN-temple#-backend-development).       |

### Which shell / terminal?

Every command block below runs the same in **PowerShell**, **Windows Command
Prompt (`cmd`)** and **macOS/Linux `bash`/`zsh`**. `npm`, `conda`, `pip` and
`git` behave identically in all of them. Steps that genuinely differ between
shells (copying `.env`) show each variant and are labelled. The
environment-variable prefixes in the [Testing](#-testing) section
(`NO_WEB_SERVER=1 …`) are `bash`/`zsh` syntax.

## ⚙️ Prerequisites

- 🟢 Node.js with npm (recommended: LTS version 24, April 2026)
- 🐍 Conda (recommended: Miniconda) – for the ZEN-temple backend

## 💻 Development

You need **two terminals**: one for this frontend and one for the ZEN-temple
backend.

### 1. Frontend (this repository)

From the `ZEN-explorer` folder, install the dependencies:

```
npm install
```

Create the `.env` file from the example:

PowerShell:

```powershell
Copy-Item .env.example .env
```

Command Prompt (`cmd`):

```bat
copy .env.example .env
```

bash / zsh:

```bash
cp .env.example .env
```

`.env` holds `PUBLIC_TEMPLE_URL` (the ZEN-temple API URL, must end with a
trailing slash) and `PUBLIC_APP_NAME`. The default
`http://localhost:8000/api/` matches the backend command in step 3.

### 2. Backend (ZEN-temple)

Clone ZEN-temple next to this repository and install it in editable mode:

```
git clone https://github.com/ZEN-universe/ZEN-temple.git
cd ZEN-temple
conda create --name <name of zen-temple env> python==3.13
conda activate <name of zen-temple env>
pip install -e ".[mypy]"
```

You do **not** need to run `zen-temple-fetch-explorer` here – during frontend
development the UI is served by this repository's dev server, not by ZEN-temple.

### 3. Run both

Make sure you have some solutions, i.e. outputs of the optimization. ZEN-temple
looks for them in `./outputs` by default; use `-o <path-to-folder>` for another
location.

**Backend terminal** – start ZEN-temple in API-only mode:

```
conda run -n <name of zen-temple env> --no-capture-output zen-visualization --api-only --no-open-browser --reload
```

**Frontend terminal** – start the ZEN-explorer dev server:

```
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) or the URL printed in the
console. Changes in `src/` reload live in the browser. If you change
`PUBLIC_TEMPLE_URL`, restart `npm run dev`.

## 🧱 Project structure

This project uses [Svelte](https://svelte.dev/) with [SvelteKit](https://kit.svelte.dev/) as a framework for the frontend development. Many pages have a similar structure and use the same components such as:

- Filters to select the solution and some parameters
- Plot configuration
- Fetching data from the API
- Compute the datasets for visualization

ZEN-temple is the backend web service that reads the outputs from the model optimization, i.e., it uses ZEN-garden's `Results` class, and preprocesses them for the frontend. Some endpoints load a large amount of data, which takes some seconds to process. Attempts have been made to optimize the loading time on ZEN-temple by using more compact data formats, but we accepted some loading time to keep the code more readable and to keep a lower memory footprint on the server.

There are four kinds of diagrams:

- Bar charts (The Transition Pathway) to show the total capacity, production, emissions, and costs per year.
- Line charts (The Energy Balance) to analyze the production and consumption per time unit.
- Sankey diagrams (The Energy System) to analyze the energy flows between the different technologies.
- Map visualizations (The Map) to analyze the spatial distribution of the energy system.

The first two diagrams plus some Pie charts are implemented using [Chart.js](https://www.chartjs.org/). For the Sankey diagram a custom SVG is generated. The map visualizations are implemented using [D3.js](https://d3js.org/).

## 🛠️ Configuration

There are some configuration options that can be edited in the `.env` file.

- `PUBLIC_TEMPLE_URL`: URL of the ZEN-temple API. It must end with a trailing slash.
- `PUBLIC_APP_NAME`: Name of the application, shown in the title. Default: "ZEN-garden Visualization"

## 🧪 Testing

There are some Playwright end-to-end tests in the `e2e` folder. They are used to check whether the plots are rendered correctly by comparing screenshots of the SVG or canvas with a screenshot of a previous version.

To run the tests, first install the headless browsers for Playwright once by running:

```bash
npx playwright install
```

Subsequently, make sure to have ZEN-temple running in the background and then run:

```bash
npm run test:e2e
```

## ✅ Linting

For type checking we use [TypeScript](https://www.typescriptlang.org/) and for linting we use [ESLint](https://eslint.org/). To run the linter and the type checker, use:

```bash
npm run lint
npm run check
```

If lint is not available and `npm install` returned a warning about `1 package has install scripts not yet covered by allowScripts: esbuild`, run:

```bash
npm install-scripts approve esbuild
npm install
```

and then

```
npm run check:lint
```

## 🗺️ Map Data

The map visualizations use the [TopoJSON](https://github.com/topojson/topojson) format for efficient storage and rendering of geographic data. The map data is bases on [Eurostat NUTS dataset](https://github.com/eurostat/Nuts2json) and the [NACIS Natural Earth dataset](https://nacis.org/initiatives/natural-earth/). The generated TopoJSON files are located in the `src/topojson/` folder. There is a [Makefile](./Makefile) to generate the TopoJSON files from the original GeoJSON files. To generate the TopoJSON files, install the required tools globally with npm and run the `make all` command:

```bash
npm install -g topojson-client topojson-server topojson-simplify ndjson-cli shapefile d3-geo-projection
make all
```

## 📦 Releases

ZEN-explorer is shipped as part of ZEN-temple. Upon every release a GitHub Actions script builds the current version of ZEN-explorer and adds the static files to the build files of the next ZEN-temple release, which is then published on PyPI. On [our website](https://zen-garden.ethz.ch/) we run this version of ZEN-temple with some of our latest solutions. Users can also install ZEN-temple on their local machines to use ZEN-explorer with their own solutions (see [ZEN-temple → Quick start](https://github.com/ZEN-universe/ZEN-temple#-quick-start)).

```bash
conda create --name zen python==3.13
conda activate zen
pip install zen-garden zen-temple
zen-garden --dataset=my_model
zen-visualization
```

The release procedure that keeps the ZEN-explorer and ZEN-temple version numbers
in sync is documented in
[ZEN-temple → Release workflow](https://github.com/ZEN-universe/ZEN-temple#-release-workflow).

## 📄 License

ZEN-explorer is licensed under the MIT License. See the LICENSE file for more details.
