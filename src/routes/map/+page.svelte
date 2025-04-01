<script lang="ts">
	import { pie, arc } from 'd3-shape';
	import { scaleOrdinal } from 'd3-scale';
	import { geoMercator, geoPath } from 'd3-geo';
	import { csv } from 'd3-fetch';
	import { schemeCategory10 } from 'd3-scale-chromatic';
	import { onMount } from 'svelte';
	import { feature, mesh } from 'topojson-client';
	import countries10m from './world.json'; // TODO: use a better world map
	// import countries10m from 'world-atlas/countries-10m.json';
	import type { DSVRowArray, DSVRowString, PieArcDatum } from 'd3';
	import { _detectPlatform } from 'chart.js';

	let width = $state(936);
	let height = $state(500);
	let radius = $state(30);

	let _projection = $derived(
		geoMercator()
			.center([20, 50])
			.scale(650)
			.translate([width / 2, height / 2])
	);

	let _path = $derived(geoPath().projection(_projection));
	let _arc = $derived(arc().innerRadius(0).outerRadius(radius));

	let _color = $derived(scaleOrdinal(schemeCategory10));

	let land: string | null = $state(null);
	let meshes: string | null = $state(null);
	let pies: any | null = $state(null);
	let lines: any | null = $state(null);

	onMount(loadData);

	async function loadData() {
		const data: DSVRowArray<string> = await csv('/data.csv');
		const world = countries10m as any;

		const _pie = pie()
			.sort(null)
			.value((d: any) => d);

		land = _path(feature(world, world.objects.countries));
		meshes = _path(mesh(world, world.objects.countries));
		pies = data.map((d: DSVRowString) => {
			const values = d.data.split('-').map((v: string) => parseInt(v));
			const total = values.reduce((a: number, b: number) => a + b, 0);

			return {
				lat: parseInt(d.lat),
				lon: parseInt(d.lon),
				label: d.label,
				total: total,
				data: _pie(values).map((p: any, i: number) => {
					return {
						color: _color(i.toString()),
						arc: arc()
							.innerRadius(0)
							.outerRadius(total / 4)(p)
					};
				})
			};
		});
		lines = combinations(pies).map((p: any) => {
			const start = [p[0].lon, p[0].lat];
			const end = [p[1].lon, p[1].lat];
			const width = Math.abs(p[0].total - p[1].total) / 16;
			return { start, end, width };
		});
	}

	function combinations(arr: any[]) {
		return arr.flatMap((v, i) => arr.slice(i + 1).map((w) => [v, w]));
	}

	function straightLine(start: [number, number], end: [number, number]) {
		const [x1, y1] = _projection(start)!;
		const [x2, y2] = _projection(end)!;
		return `M${x1},${y1} L${x2},${y2}`;
	}
</script>

<h1>Map</h1>

Filters

<hr />

<div>
	<svg {width} {height}>
		<g>
			<path class="land" d={land} />
			<path class="mesh" d={meshes} fill="none" stroke="white" stroke-width="1px" />
		</g>
		<g>
			{#each lines as line}
				<g class="line">
					<path d={straightLine(line.start, line.end)} stroke="#123456" stroke-width={line.width} />
				</g>
			{/each}
		</g>
		<g>
			{#each pies as pie}
				<!-- <g class="line">
					<path d={straightLine([pie.lon, pie.lat], [pie.lon + 3, pie.lat - 5])} stroke="#123456" stroke-width={pie.total / 16} />
				</g> -->
				<g class="pies" transform={`translate(${_projection([pie.lon, pie.lat])})`}>
					<!-- <text y={-radius - 5} style="text-anchor: middle;">
						{p.label}
					</text> -->
					{#each pie.data as d, i}
						<path class="arc" d={d.arc} fill={d.color} />
					{/each}
				</g>
			{/each}
		</g>
	</svg>
</div>

<style>
	svg {
		background: #91a9cf;
	}
	.land {
		fill: #b3c497;
	}
</style>
