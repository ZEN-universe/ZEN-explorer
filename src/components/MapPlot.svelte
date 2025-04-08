<script lang="ts">
	import { pie, arc } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';
	import { geoMercator, geoPath } from 'd3-geo';
	import { schemeCategory10 } from 'd3-scale-chromatic';
	import { pointer } from 'd3-selection';
	import { feature, mesh } from 'topojson-client';
	import countries10m from '../geojson/world.json'; // TODO: use a better world map
	// import countries10m from 'world-atlas/countries-10m.json';
	import { _detectPlatform } from 'chart.js';
	import { polygonContains, type DSVRowArray, type DSVRowString } from 'd3';
	import type { MultiPolygon, Polygon, Position } from 'geojson';
	import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';

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
		data: MapPlotData;
		edges?: MapPlotData;
	}
	let { data, edges = {} }: Props = $props();

	interface Pie {
		lon: number;
		lat: number;
		label: string;
		country: number;
		total: number;
		data: {
			color: string;
			arc: string | null;
			technology: string;
			value: number;
		}[];
	}

	let svg: SVGSVGElement;
	let tooltip: HTMLDivElement;

	let width = $state(936);
	let height = $state(500);
	let maxRadius = $state(30);
	let maxEdgeWidth = $state(8);

	let tooltipY = $state(0);
	let tooltipYOffset = $state(0);
	let tooltipX = $state(0);
	let tooltipHeight = $derived(() => tooltip?.clientHeight || 0);
	let tooltipOnTop = $derived(tooltipY - tooltipYOffset > tooltipHeight());

	let selected_pie: Pie | null = $state(null);

	let _projection = $derived(
		geoMercator()
			.center([20, 51])
			.scale(660)
			.translate([width / 2, height / 2])
	);

	let _path = $derived(geoPath().projection(_projection));
	const _color = scaleOrdinal(schemeCategory10);
	const _pie = pie()
		.sort(null)
		.value((d: any) => d);

	let maxTotal = $derived(
		Object.entries(data).reduce((acc: number, [node, values]: [string, DataRow[]]) => {
			const total = values.reduce((acc: number, row: DataRow) => acc + row.value, 0);
			return Math.max(acc, total);
		}, 0)
	);
	let maxEdge = $derived(
		Object.entries(edges).reduce((acc: number, [node, values]: [string, DataRow[]]) => {
			const total = values.reduce((acc: number, row: DataRow) => Math.max(acc, row.value), 0);
			return Math.max(acc, total);
		}, 0)
	);

	let countries = $derived(
		feature(
			countries10m as unknown as Topology,
			countries10m.objects.countries as GeometryCollection
		)
	);
	let land: string | null = $derived(_path(countries));
	let meshes: string | null = $derived(
		_path(
			mesh(
				countries10m as unknown as Topology,
				countries10m.objects.countries as GeometryCollection,
				(a: GeometryObject, b: GeometryObject) => a !== b
			)
		)
	);
	let pies: Pie[] = $derived(
		Object.entries(data).map(([node, values]: [string, DataRow[]]) => {
			const total = values.reduce((acc: number, row: DataRow) => acc + row.value, 0);
			const _arc = arc().innerRadius(0).outerRadius(computeRadius(total));
			const [lon, lat] = nodeCoords[node] || [40, 40];

			return {
				lon: lon,
				lat: lat,
				label: node,
				country: Number(getCountry([lon, lat])?.id || -1),
				total: total,
				data: _pie(values.map((d) => d.value)).map((p: any, i: number) => {
					return {
						color: _color(i.toString()),
						arc: _arc(p),
						technology: values[i].technology,
						value: p.data
					};
				})
			};
		})
	);
	let lines = $derived(
		Object.entries(edges).map(([node, values]) => {
			const [a, b] = node.split('-');
			const maxValue = values.reduce((acc: number, row: DataRow) => Math.max(acc, row.value), 0);
			return {
				start: nodeCoords[a] || [40, 40],
				end: nodeCoords[b] || [40, 40],
				width: maxEdgeWidth * Math.sqrt(maxValue / maxEdge)
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

	function straightLine(start: [number, number], end: [number, number]) {
		const [x1, y1] = _projection(start)!;
		const [x2, y2] = _projection(end)!;
		return `M${x1},${y1} L${x2},${y2}`;
	}

	function getCountry(coord: [number, number]) {
		return countries.features.find((f) => {
			return (f.geometry as Polygon | MultiPolygon).coordinates.find((c1) => {
				return (
					polygonContains(c1 as [number, number][], coord) ||
					c1.find((c2) => polygonContains(c2 as [number, number][], coord))
				);
			});
		});
	}

	function computeRadius(total: number) {
		return (total / maxTotal) * maxRadius;
	}

	function onResize() {
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
	}

	function onMouseMove(event: MouseEvent) {
		const pos = _projection.invert!(pointer(event));
		if (!pos) return;

		const country = getCountry(pos);
		if (!country) return;

		const pie = pies.find((p) => p.country == country?.id);
		selected_pie = pie || null;

		if (pie) {
			const [x, y] = _projection([pie.lon, pie.lat])!;
			tooltipY = y;
			tooltipX = x;
			tooltipYOffset = computeRadius(pie.total) + 5;
		}
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
				<g class="pies" transform={`translate(${_projection([pie.lon, pie.lat])})`}>
					{#each pie.data as d}
						<path class="arc" d={d.arc} fill={d.color} />
					{/each}
				</g>
			{/each}
		</g>
	</svg>
	<div
		class="position-absolute bg-black bg-opacity-75 text-white p-2 rounded fs-8 pe-none"
		style:top={tooltipOnTop ? `${tooltipY - tooltipYOffset}px` : `${tooltipY + tooltipYOffset}px`}
		style:left={`${tooltipX}px`}
		style:transform={tooltipOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
		style:opacity={selected_pie ? 1 : 0}
		style:transition="opacity 0.3s"
		bind:this={tooltip}
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
		{#if selected_pie}
			<h5 class="fs-7 mb-0">{selected_pie.label}</h5>
			{#each selected_pie.data as d}
				<div>
					<svg width="16" height="16">
						<rect width="16" height="16" fill={d.color} />
					</svg>
					{stringify(d.technology)}: {d.value.toFixed(3)}
				</div>
			{/each}
		{/if}
	</div>
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
