<script lang="ts">
	import { pie as d3pie, arc as d3arc } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';
	import { geoMercator, geoPath } from 'd3-geo';
	import { schemeCategory10 } from 'd3-scale-chromatic';
	import { pointer } from 'd3-selection';
	import { feature, mesh } from 'topojson-client';
	import countries10m from '../geojson/world.json';
	// TODO: use a better world map
	// import countries10m from 'world-atlas/countries-10m.json';
	import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export interface DataRow {
		technology: string;
		value: number;
	}
	export interface MapPlotData {
		[node: string]: DataRow[];
	}

	interface Props {
		pieData: MapPlotData;
		lineData?: MapPlotData;
		nodeCoords?: { [node: string]: [number, number] };
		unit: string;
	}
	let { pieData, lineData = {}, nodeCoords = {}, unit }: Props = $props();

	interface Pie {
		x: number;
		y: number;
		label: string;
		total: number;
		data: {
			color: string;
			arc: string | null;
			technology: string;
			value: number;
		}[];
	}

	interface Line {
		label: string;
		values: DataRow[];
		start: [number, number];
		end: [number, number];
		width: number;
	}

	let svg: SVGSVGElement;
	let tooltip: HTMLDivElement;

	let width = $state(936);
	let height = $state(600);

	const minRadius = 5;
	const maxRadius = 30;
	const minLineWidth = 1;
	const maxLineWidth = 8;

	let selectedPie: Pie | undefined = $state(undefined);
	let selectedLines: Line[] = $state([]);

	let tooltipX = $derived.by(() => {
		if (selectedPie) return selectedPie.x;
		else if (selectedLines.length > 0)
			return 0.5 * (selectedLines[0].start[0] + selectedLines[0].end[0]);
		return 0;
	});
	let tooltipY = $derived.by(() => {
		if (selectedPie) return selectedPie.y;
		else if (selectedLines.length > 0)
			return 0.5 * (selectedLines[0].start[1] + selectedLines[0].end[1]);
		return 0;
	});
	let tooltipYOffset = $derived.by(() => 5 + (selectedPie ? computeRadius(selectedPie.total) : 0));
	let tooltipOnTop = $derived.by(() => tooltipY - tooltipYOffset > 180);

	let projection = $derived(
		geoMercator()
			.center([20, 51])
			.scale(660)
			.translate([width / 2, height / 2])
	);

	let computePath = $derived(geoPath().projection(projection));
	const computeColor = scaleOrdinal(schemeCategory10);
	const computePie = d3pie()
		.sort(null)
		.value((d: any) => d);

	let minTotal = $derived(
		Object.values(pieData).reduce((acc, values) => {
			const total = values.reduce((acc, row) => acc + row.value, 0);
			return Math.min(acc, total);
		}, 0)
	);
	let maxTotal = $derived(
		Object.values(pieData).reduce((acc, values) => {
			const total = values.reduce((acc, row) => acc + row.value, 0);
			return Math.max(acc, total);
		}, 0)
	);
	let minEdge = $derived(
		Object.values(lineData).reduce((acc, values) => {
			const total = values.reduce((acc, row) => Math.max(acc, row.value), 0);
			return Math.min(acc, total);
		}, 0)
	);
	let maxEdge = $derived(
		Object.values(lineData).reduce((acc, values) => {
			const total = values.reduce((acc, row) => Math.max(acc, row.value), 0);
			return Math.max(acc, total);
		}, 0)
	);

	let countries = $derived(
		feature(
			countries10m as unknown as Topology,
			countries10m.objects.countries as GeometryCollection
		)
	);
	let land: string | null = $derived(computePath(countries));
	let meshes: string | null = $derived(
		computePath(
			mesh(
				countries10m as unknown as Topology,
				countries10m.objects.countries as GeometryCollection,
				(a: GeometryObject, b: GeometryObject) => a !== b
			)
		)
	);

	let pies: Pie[] = $derived(
		Object.entries(pieData).map(([node, values]: [string, DataRow[]]) => {
			const total = values.reduce((acc: number, row: DataRow) => acc + row.value, 0);
			const computeArc = d3arc().innerRadius(0).outerRadius(computeRadius(total));
			const [x, y] = projection(nodeCoords[node] || [0, 0])!;

			return {
				x: x,
				y: y,
				label: node,
				total: total,
				data: computePie(values.map((d) => d.value)).map((p: any, i: number) => {
					return {
						color: computeColor(values[i].technology),
						arc: computeArc(p),
						technology: values[i].technology,
						value: p.data
					};
				})
			};
		})
	);
	let lines: Line[] = $derived(
		Object.entries(lineData).map(([node, values]) => {
			const [a, b] = node.split('-');
			const maxValue = values.reduce((acc: number, row: DataRow) => Math.max(acc, row.value), 0);
			return {
				label: node,
				values: values,
				start: projection(nodeCoords[a] || [40, 40])!,
				end: projection(nodeCoords[b] || [40, 40])!,
				width: computeEdgeWidth(maxValue)
			};
		})
	);

	let technologies: string[] = $derived(
		Object.values(pieData).reduce((acc: string[], values) => {
			const techs = values.map((d) => d.technology);
			return [...new Set([...acc, ...techs])];
		}, [])
	);

	onMount(() => {
		window.addEventListener('resize', onResize);
		onResize();
	});

	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});

	function onResize() {
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
	}

	function onMouseMove(event: MouseEvent) {
		const pos = pointer(event);
		const coords = projection.invert!(pos);
		if (!coords) return;

		selectedPie = findPie(pos);
		if (selectedPie) {
			selectedLines = [];
			return;
		}

		selectedLines = filterLines(pos);
	}

	function findPie(pos: [number, number]) {
		const [px, py] = pos;
		return pies.find((pie) => {
			const dx = px - pie.x;
			const dy = py - pie.y;
			return Math.sqrt(dx * dx + dy * dy) < computeRadius(pie.total);
		});
	}

	function filterLines(pos: [number, number]) {
		const [px, py] = pos;
		return lines.filter((line) => {
			let [x1, y1] = line.start!;
			let [x2, y2] = line.end!;

			const ax = px - x1;
			const ay = py - y1;
			const bx = x2 - x1;
			const by = y2 - y1;

			const adotb = ax * bx + ay * by;
			const bSquared = Math.pow(bx, 2) + Math.pow(by, 2);
			if (adotb < 0 || adotb > bSquared || bSquared < 1e-10) return false;

			const distSquared = Math.pow(ax, 2) + Math.pow(ay, 2) - Math.pow(adotb, 2) / bSquared;
			return 4 * distSquared < Math.pow(maxLineWidth, 2);
		});
	}

	function computeEdgeWidth(total: number) {
		return minLineWidth + ((total - minEdge) / (maxEdge - minEdge)) * (maxLineWidth - minLineWidth);
	}

	function computeRadius(total: number) {
		return minRadius + ((total - minTotal) / (maxTotal - minTotal)) * (maxRadius - minRadius);
	}

	function straightLine(start: [number, number], end: [number, number]) {
		const [x1, y1] = start;
		const [x2, y2] = end;
		return `M${x1},${y1} L${x2},${y2}`;
	}

	function stringify(value: string) {
		let res = value.replace(/_/g, ' ');
		return res.charAt(0).toUpperCase() + res.slice(1);
	}
</script>

<div class="position-relative">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg class="map" {width} {height} bind:this={svg} onmousemove={onMouseMove}>
		<g>
			<path class="land" d={land} />
			<path class="mesh" d={meshes} fill="none" stroke="white" stroke-width="1px" />
		</g>
		<g>
			{#each lines as line}
				<g class="line">
					<path d={straightLine(line.start, line.end)} stroke="#666" stroke-width={line.width} />
				</g>
			{/each}
		</g>
		<g>
			{#each pies as pie}
				<g class="pies" transform={`translate(${pie.x}, ${pie.y})`}>
					{#each pie.data as d}
						<path class="arc" d={d.arc} fill={d.color} />
					{/each}
				</g>
			{/each}
		</g>
	</svg>
	<div class="position-absolute bottom-0 end-0 m-2 p-2 bg-black bg-opacity-75 text-white">
		<h5 class="visually-hidden">Legend</h5>
		{#each technologies as t}
			<div class="d-flex align-items-center">
				<svg width="16" height="16" class="me-1">
					<rect width="16" height="16" fill={computeColor(t)} />
				</svg>
				{stringify(t)}
			</div>
		{/each}
	</div>
	{#if selectedPie || selectedLines.length > 0}
		<div
			class="position-absolute bg-black bg-opacity-75 text-white py-2 rounded fs-8 pe-none"
			style:top={tooltipOnTop ? `${tooltipY - tooltipYOffset}px` : `${tooltipY + tooltipYOffset}px`}
			style:left={`${tooltipX}px`}
			style:transform={tooltipOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
			bind:this={tooltip}
			transition:fade={{ duration: 300 }}
		>
			{#if tooltipOnTop}
				<svg
					class="position-absolute translate-middle-x opacity-75 start-50"
					style:bottom="-5px"
					width="10"
					height="5"
				>
					<polygon points="0,0 10,0 5,5" fill="black" />
				</svg>
			{:else}
				<svg
					class="position-absolute translate-middle-x opacity-75 start-50"
					style:top="-5px"
					width="10"
					height="5"
				>
					<polygon points="0,5 10,5 5,0" fill="black" />
				</svg>
			{/if}
			{#if selectedPie}
				<h5 class="fs-7 mb-0 px-2">{selectedPie.label}</h5>
				{#each selectedPie.data as d}
					<div class="px-2">
						<svg width="16" height="16">
							<rect width="16" height="16" fill={d.color} />
						</svg>
						{stringify(d.technology)}: {d.value.toFixed(3)}
						{unit}
					</div>
				{/each}
				{#if selectedPie.data.length > 1}
					<div class="px-2">
						<strong>Total: {selectedPie.total.toFixed(3)} {unit}</strong>
					</div>
				{/if}
			{:else if selectedLines.length > 0}
				{#each selectedLines as line, i}
					<div class={['px-2', i > 0 && 'border-top border-secondary mt-1 pt-1']}>
						<h5 class="fs-7 mb-0">{line.label}</h5>
						{#each line.values as d}
							<div>
								{stringify(d.technology)}: {d.value.toFixed(3)}
								{unit}
							</div>
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.map {
		background: #91a9cf;
	}
	.land {
		fill: #b3c497;
	}
	.fs-7 {
		font-size: 0.875rem;
	}
	.fs-8 {
		font-size: 0.75rem;
	}
</style>
