# ZEN-explorer

ZEN-explorer is the frontend of the [ZEN-garden](https://github.com/ZEN-universe/ZEN-garden) visualization platform. It uses the endpoints provided by its web service [ZEN-temple](https://github.com/ZEN-universe/ZEN-temple) to fetch data of the provided solutions and visualize them.

## Installation

Prerequisites:
- Node.js with npm (recommended: LTS version 24, April 2026)
- Conda (recommended: Miniconda)

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

## Usage

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

## Project structure

This project uses Svelte (https://svelte.dev/) with SvelteKit (https://kit.svelte.dev/) as a framework for the frontend development. Many pages have a similar structure and use the same components such as:
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

The first two diagrams plus some Pie charts are implemented using Chart.js (https://www.chartjs.org/). For the Sankey diagram a custom SVG is generated. The map visualizations are implemented using D3.js (https://d3js.org/).

## Releases

ZEN-explorer is shipped as part of ZEN-temple. Upon every release a GitHub Actions script builds the current version of ZEN-explorer and adds the static files to the built files of the ZEN-temple release, which is then published on PyPI. On our web server we run this version of ZEN-temple that can be accessed on [http://zen-garden.ethz.ch/](https://zen-garden.ethz.ch/) with some of our latest solutions. Users can also install ZEN-temple on their local machines to use ZEN-explorer with their own solutions.

## License

ZEN-explorer is licensed under the MIT License. See the LICENSE file for more details.
