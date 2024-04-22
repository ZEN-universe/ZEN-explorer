# Explorer
The Explorer is the frontend of the ZEN Land. It directly uses the endpoints provided by the web service ZEN Temple (https://github.com/ZEN-universe/ZEN-temple) to fetch the data of the solutions and plots them.

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