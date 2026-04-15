# ZEN-explorer

ZEN-explorer is the frontend of the [ZEN-garden](https://github.com/ZEN-universe/ZEN-garden) visualization platform. It uses the endpoints provided by its web service [ZEN-temple](https://github.com/ZEN-universe/ZEN-temple) to fetch data of the provided solutions and visualize them.

## ⚙️ Installation

Prerequisites:

- 🟢 Node.js with npm (recommended: LTS version 24, April 2026)
- 🐍 Conda (recommended: Miniconda)

Go to the ZEN-explorer directory and install the dependencies with:

```bash
npm install
cp .env.example .env
```

In a second terminal, create a conda environment and install the dependencies for ZEN-temple with:

```
conda create --name zen python==3.13
conda activate zen
pip install -e .[mypy]
```

If you update the endpoint of the ZEN-temple API, make sure to update the `PUBLIC_TEMPLE_URL` variable in the `.env` file of ZEN-explorer as well.

## 🚀 Usage

To develop ZEN-explorer you must run ZEN-temple in the background. Make sure you have some solutions, i.e., outputs of the optimization, located at `zen-temple/outputs`. Then, start ZEN-temple's web server with the following command:

```bash
conda run -n <your-conda-env> --no-capture-output python -m zen_temple.main --no-open-browser --reload
```

Optionally, you can define a path to another `outputs` folder using the `-o <path-to-folder>` flag.

Next, in a second terminal start ZEN-explorer's dev server using:

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) or the URL printed in the console to see ZEN-explorer in action. You can now start developing the visualization platform and see your changes in real time in the browser.

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

## 🗺️ Map Data

The map visualizations use the [TopoJSON](https://github.com/topojson/topojson) format for efficient storage and rendering of geographic data. The map data is bases on [Eurostat NUTS dataset](https://github.com/eurostat/Nuts2json) and the [NACIS Natural Earth dataset](https://nacis.org/initiatives/natural-earth/). The generated TopoJSON files are located in the `src/topojson/` folder. There is a [Makefile](./Makefile) to generate the TopoJSON files from the original GeoJSON files. To generate the TopoJSON files, install the required tools globally with npm and run the `make all` command:

```bash
npm install -g topojson-client topojson-server topojson-simplify ndjson-cli shapefile d3-geo-projection
make all
```

## 📦 Releases

ZEN-explorer is shipped as part of ZEN-temple. Upon every release a GitHub Actions script builds the current version of ZEN-explorer and adds the static files to the build files of the next ZEN-temple release, which is then published on PyPI. On [our website](https://zen-garden.ethz.ch/) we run this version of ZEN-temple with some of our latest solutions. Users can also install ZEN-temple on their local machines to use ZEN-explorer with their own solutions.

```bash
conda create --name zen python==3.13
conda activate zen
pip install zen-garden zen-temple
zen-garden --dataset=my_model
zen-visualization
```

## 📄 License

ZEN-explorer is licensed under the MIT License. See the LICENSE file for more details.
