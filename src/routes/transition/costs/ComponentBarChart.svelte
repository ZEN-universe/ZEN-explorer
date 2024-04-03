<script lang="ts">
	import * as d3 from 'd3';
	import { afterUpdate, onMount } from 'svelte';

	let vis: HTMLElement;

	export let component_data: Papa.ParseResult<any>;

	// Declare the chart dimensions and margins.
	let width = 640;
	let height = 400;
	const marginTop = 20;
	const marginRight = 20;
	const marginBottom = 30;
	const marginLeft = 40;

	let xScale = d3.scaleLinear().domain([0, 10]);
	let yScale = d3.scaleLinear().domain([0, 10]);
	const margin = {
		top: 20,
		right: 20,
		bottom: 30,
		left: 30
	};

	onMount(() => {
		redraw();
		window.addEventListener('resize', redraw);
	});

	afterUpdate(() => {
		redraw();
	});

	function redraw(): void {
		if (!component_data) {
			return;
		}
		interface Values {
			[index: string]: number;
		}

		let data = component_data.data;
		let current_data = data[0];
		let string_years: Array<string> = Object.keys(current_data).filter((v) => !isNaN(+v));
		let others = Object.keys(current_data).filter((v) => !string_years.includes(v));
		let values: Values = {};

		for (let year in string_years) {
			values[year] = +current_data[year];
		}

		console.log(values);

		// empty vis div
		d3.select(vis).html(null);
		const x = d3
			.scaleBand()
			.domain(string_years)
			.range([marginLeft, width - marginRight])
			.padding(0.1);

		// Declare the y (vertical position) scale.
		const y = d3
			.scaleLinear()
			.domain([0, Math.max(...Object.values(values))])
			.range([height - marginBottom, marginTop]);

		const svg = d3.select(vis).append('svg').attr('width', width).attr('height', height);

		// Add the x-axis.
		svg
			.append('g')
			.attr('transform', `translate(0,${height - marginBottom})`)
			.call(d3.axisBottom(x));

		// Add the y-axis.
		svg.append('g').attr('transform', `translate(${marginLeft},0)`).call(d3.axisLeft(y));
		svg
			.append('g')
			.attr('fill', 'steelblue')
			.selectAll()
			.data(string_years)
			.join('rect')
			.attr('x', (d) => x(d))
			.attr('y', (d) => y(values[d]))
			.attr('height', (d) => y(0) - y(values[d]))
			.attr('width', x.bandwidth());
	}
</script>

<div id="vis" bind:this={vis}></div>

<style>
	main {
		height: 100%;
		display: flex;
	}

	#vis {
		width: 50vw;
		height: 50vh;
		background-color: snow;
	}

	circle {
		fill: black;
		fill-opacity: 0.5;
	}
</style>
