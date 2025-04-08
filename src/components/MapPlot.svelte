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

	// TODO: Load coordinates dynamically from server
	const nodeCoords: { [node: string]: [number, number] } = {
		AT: [14.5501, 47.5162],
		BE: [4.4699, 50.8503],
		BG: [23.3421, 42.6977],
		CH: [8.2275, 46.8182],
		CY: [33.4299, 35.1264],
		CZ: [15.4729, 49.8175],
		DE: [10.4541, 51.1657],
		DK: [9.5018, 56.2639],
		EE: [24.7535, 58.5953],
		EL: [21.7491, 39.0742],
		ES: [-3.7492, 40.4637],
		FI: [25.7482, 61.9241],
		FR: [2.2137, 46.6033],
		HR: [15.2, 45.1],
		HU: [19.5058, 47.1625],
		IE: [-6.2603, 53.3498],
		IT: [12.4964, 41.9028],
		LT: [23.8813, 55.1694],
		LU: [6.1319, 49.6116],
		LV: [24.6032, 56.8796],
		ME: [19.3744, 42.7087],
		MK: [21.7453, 41.6086],
		MT: [14.4058, 35.9375],
		NL: [5.2913, 52.1326],
		NO: [10.7461, 59.9139],
		PL: [19.1451, 51.9194],
		PT: [-8.2245, 39.3999],
		RO: [24.9668, 45.9432],
		RS: [21.0059, 44.0165],
		SE: [18.6435, 60.1282],
		SI: [14.9955, 46.1512],
		SK: [19.3956, 48.6728],
		UK: [-0.1276, 51.5072]
	};

	interface Props {
		pieData: MapPlotData;
		lineData?: MapPlotData;
	}
	let { pieData, lineData = {} }: Props = $props();

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
	let tooltipOnTop = $derived.by(() => tooltipY - tooltipYOffset > (tooltip?.clientHeight || 0));

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
			const [x, y] = projection(nodeCoords[node] || [40, 40])!;

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
					</div>
				{/each}
			{:else if selectedLines.length > 0}
				{#each selectedLines as line, i}
					<div class={['px-2', i > 0 && 'border-top border-secondary mt-1 pt-1']}>
						<h5 class="fs-7 mb-0">{line.label}</h5>
						{#each line.values as d}
							<div>
								{stringify(d.technology)}: {d.value.toFixed(3)}
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
