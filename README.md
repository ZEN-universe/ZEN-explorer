# Explorer

The Explorer is the frontend of the ZEN-garden (https://github.com/ZEN-universe/ZEN-garden) visualization platform. It directly uses the endpoints provided by the web service ZEN-temple (https://github.com/ZEN-universe/ZEN-temple) to fetch the data of the solutions and plots them.

## Project structure

Each route in Svelte is one folder in the `routes` that contains a `+page.svelte` file. All of these pages are more or less independent of each other. There are some parts of the pages, that can be reused. These are called components and are contained in the `components` folder. The `lib` folder contains utilities that are used by different pages and components.

## Workflows

Anytime any changes are pushed to the main branch, a Github workflow is triggered which builds a static site (see https://svelte.dev/docs/kit/adapter-static). These static files are automatically pushed to the ZEN Temple repository (https://github.com/ZEN-universe/ZEN-temple) where they are served by a FastAPI Server.

> [!NOTE]
> This means that the ZEN Temple always has the latest version of the ZEN Explorer. If at some point the ZEN Temple should have a specific version of the ZEN Explorer, the pulling of the correct version should be done on Temple side.

## Running the explorer

The project uses Svelte (https://svelte.dev/) and Typescript (https://www.typescriptlang.org/). In order to create browser readable files (`.html`, `.css`, and `.js`) from these framework files (`.svelte` and `.ts`) compilation is necessary which is done by Vite (https://vite.dev/).

On a larger scale, the ZEN Explorer is a static website which means that it is a collection of `.html`, `.css`, and `.js` files that are not dependant on the user that fetches them.
API calls to ZEN Temple are being processed using the standard Javascript Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

Therefore, in order for the explorer to be working, a running ZEN Temple API Server is necessary. You can either start this server locally by your own (which would be running under http://localhost:8000/api by default) or you can use one of the public API server that is hosted on our VM, for example https://zen-garden.ethz.ch/api.
This URL has to be defined in the `.env` file.

In general, you will probably use one of the following to approaches if you want to use the explorer:

### Local Development on Explorer and Temple

If you have to work on both ends, ZEN Temple and ZEN Explorer or you want ZEN Temple to serve your local solutions, you can follow these steps:

1. First you need a running instance of ZEN Temple on your local machine. For this, follow the instructions given in the Readme of ZEN Temple (https://github.com/ZEN-universe/ZEN-temple/blob/main/README.md).
   You can test if you have a running ZEN Temple instance on your machine by opening [http://localhost:8000/api/docs](http://localhost:8000/api/docs) in your browser. If you see the Swagger documentation of the Temple endpoints, everything is running correctly.
2. Clone the ZEN Explorer repository and switch to the directory that contains the project and make sure that the variable `PUBLIC_TEMPLE_URL` in the `.env` file is set to `http://localhost:8000/api/`.
3. Install the dependncies with `npm install`. An installation of Node.js is necessary for this, see https://nodejs.org/en.
4. Once you installed the dependencies, you can compile the `.svelte` and `.ts` files to `.html`, `.css`, and `.js` with the command `npm run dev`. This command does not only compile the files but also starts a local Node.js server that hosts the compiled files. You can check that everything worked by opening http://localhost:5174/. Additionally to the compilation and hosting of the compiled files, the command starts a file watcher that watches for changes in any files. Once you change any of the files in the `src` folder, everything is being recompiled and you can see the changes in the browser without having to restart the command.

### Local Development on Explorer

If you do not have to work on the Temple and can work with the solutions that are provided on our public API, you can skip the first step in the previous setup and set the `PUBLIC_TEMPLE_URL` to `https://zen-garden.ethz.ch/api/`. This means that the frontend now fetches the public ZEN Temple API.

### Hosting without Development

If you only want to use the Explorer without doing any development work, you do not have to compile the HTML files yourself. Since on every commit to ZEN Explorer the HTML files are compiled automatically and pushed to the ZEN Temple repository, the easiest way to access the Explorer in that case is to start the ZEN Temple API Server as described in the README and open http://localhost:8000/. It is important to see that in this case, the FastAPI server from the ZEN Temple repository acts as an API Server as well as the server that serves the static HTML files.

> [!NOTE]
> If you want to host ZEN Explorer on a public VM, this approach is also recommended since you only have to use FastAPI to act as an API Server as well as the Webserver that hosts the static files.

The difference between these approaches can be seen in the following graphic:

![ZEN_Explorer drawio](https://github.com/user-attachments/assets/5eda98fe-ac07-4c8b-8ec3-591fd093afe1)
