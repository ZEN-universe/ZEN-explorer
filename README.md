# Explorer
The Explorer is the frontend of the ZEN-garden (https://github.com/ZEN-universe/ZEN-garden) visualization platform. It directly uses the endpoints provided by the web service ZEN-temple (https://github.com/ZEN-universe/ZEN-temple) to fetch the data of the solutions and plots them.

## Setup
The project uses Svelte as the Javascript framework (https://svelte.dev/). The Javascript framework is responsible for setting up the pages HTML structure and the dynamic parts that are happening. 
In this case, this is mostly fetching the data of the results and setting up the correct filters. The plots themselves are created with Chart.js (https://www.chartjs.org/).
The structure of the project is provided by SvelteKit, which is the official recommendation to set up a svelte project (https://kit.svelte.dev/).

> [!NOTE]
> Javascript Frameworks gained a lot more impact in web development in the past years. The standard used to be to sepearate HTML, CSS and Javascript, where HTML was used to define the structure of a webpage, CSS the styling, and Javascript the logic that was happening on the webbrowser.
> A webserver was set up to provide these Files to the client. With modern web frameworks like Svelte or React, the boundaries became fuzzier and all these steps can be handled by a single framework. This is mostly possible thanks to Node.js, a Javascript Runtime Environment that let's you execute Javascript in your terminal and not just in a web browser.

## Developing
In order to start the frontend locally, you need to install Node.js. 
Once installed, you can install the dependencies by running the command `npm install` from the root directory of the project. 
At last, you have to edit the `.env` file and specify the URL of a running ZEN Temple server.
In order to start the development mode, you can start the local server with `npm run dev`.
This will start a server running on `http://localhost:5173/explorer` which you can open in your browser.

## Deployment
The simplest way to start the frontend in production mode is by using the provided Dockefile. Simply install Docker (https://docs.docker.com/get-docker/), build the image with `docker build . -t explorer` and run it with `docker run -p 8050:8050 explorer`. 


## Project structure

Each route in Svelte is one folder in the `routes` that contains a `+page.svelte` file. All of these pages are more or less independent of each other. There are some parts of the pages, that can be reused. These are called components and are contained in the `components` folder. The `lib` folder contains utilities that are used by different pages and components.


## Workflows

Anytime any changes are pushed to the main branch, a Github workflow is triggered which builds a static site (see https://svelte.dev/docs/kit/adapter-static). These static files are automatically pushed to the ZEN Temple repository (https://github.com/ZEN-universe/ZEN-temple) where they are served by a FastAPI Server.

> [!NOTE]
> This means that the ZEN Temple always has the latest version of the ZEN Explorer. If at some point the ZEN Temple should have a specific version of the ZEN Explorer, the pulling of the correct version should be done on Temple side.