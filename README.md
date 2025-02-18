# Explorer
The Explorer is the frontend of the ZEN-garden (https://github.com/ZEN-universe/ZEN-garden) visualization platform. It directly uses the endpoints provided by the web service ZEN-temple (https://github.com/ZEN-universe/ZEN-temple) to fetch the data of the solutions and plots them.

## Setup
The project uses Svelte (https://svelte.dev/) and Typescript (https://www.typescriptlang.org/). In order to create browser readble files (`.html`, `.css`, and `.js`) from these framework files (`.svelte` and `.ts`) Vite is used (https://vite.dev/).

On a conceptual scale, the ZEN Explorer is a static website which means that it is a collection of `.html`, `.css`, and `.js` files that are not dependant on the user that fetches them. 
In these static files, API calls to ZEN Temple are being processed using the standard Javascript Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). 
Therefore, in order for the explorer to be working, a running ZEN Temple API Server is necessary. You can either start this server locally by your own (which would be running under http://0.0.0.0:8000 by default) or you can use one of the API server that is hosted on our VM, for example https://zen-garden.ethz.ch/api.
This URL has to be defined in the .env file and if you specify http://0.0.0.0:8000, you also need a running ZEN-Temple instance on your machine. 

## Developing
A normal webbrowser such as Chrome or Firefox can only interpret `.html`, `.css`, and `.js` files. Therefore it is necessary to compile the svelte (`.svelte`) and typescript (`.ts`) files into browser readable files. This is done by Vite (https://vite.dev/). Vite
In order to create the HTML, JS and CSS files that are necessary to show the Visualization, you need Node.js which compiles the `.svelte`, `.ts` and other files into browser readable `.html`, `.js` and `.css` files. 
In order to start the frontend locally, you need to install Node.js. 
Once installed, you can install the dependencies by running the command `npm install` from the root directory of the project. 
At last, you have to edit the `.env` file and specify the URL of a running ZEN Temple server.
In order to start the development mode, you can start the local server with `npm run dev`.
This will start a server running on `http://localhost:5173/` which you can open in your browser.

## Project structure

Each route in Svelte is one folder in the `routes` that contains a `+page.svelte` file. All of these pages are more or less independent of each other. There are some parts of the pages, that can be reused. These are called components and are contained in the `components` folder. The `lib` folder contains utilities that are used by different pages and components.


## Workflows

Anytime any changes are pushed to the main branch, a Github workflow is triggered which builds a static site (see https://svelte.dev/docs/kit/adapter-static). These static files are automatically pushed to the ZEN Temple repository (https://github.com/ZEN-universe/ZEN-temple) where they are served by a FastAPI Server.

> [!NOTE]
> This means that the ZEN Temple always has the latest version of the ZEN Explorer. If at some point the ZEN Temple should have a specific version of the ZEN Explorer, the pulling of the correct version should be done on Temple side.
