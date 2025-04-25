<script lang="ts">
	import { geoAlbers, geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
	import { scaleOrdinal } from 'd3-scale';
	import { schemeCategory10 } from 'd3-scale-chromatic';
	import { pointer } from 'd3-selection';
	import { pie as d3pie, arc as d3arc } from 'd3-shape';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { feature, mesh } from 'topojson-client';
	import type { ExtendedFeatureCollection } from 'd3-geo';
	import type {
		GeometryCollection,
		GeometryObject,
		MultiLineString,
		MultiPolygon,
		Topology
	} from 'topojson-specification';

	// import topology from '../geojson/world.json';
	// import topology from '../geojson/nuts.json';
	import topology from '../topojson/world-3.json';

	let canvas: HTMLCanvasElement;

	// Map elements
	let width = $state(936);
	let height = $state(800);

	let projection = $derived.by(() => {
		// if (!nodeCoords || Object.keys(nodeCoords).length === 0) {
		// Default projection for the world map
		// return geoMercator().translate([width / 2, height / 2]);
		// return geoNaturalEarth1()
		return geoMercator()
			.center([11, 49])
			.scale(660)
			.translate([width / 2, height / 2]);
		// }

		// const featureCollection: ExtendedFeatureCollection = {
		// 	type: 'FeatureCollection',
		// 	features: Object.values(nodeCoords).map((coords) => ({
		// 		type: 'Feature',
		// 		geometry: {
		// 			type: 'Point',
		// 			coordinates: coords
		// 		},
		// 		properties: {}
		// 	}))
		// };

		// return geoMercator().fitExtent(
		// 	[
		// 		[maxRadius, maxRadius],
		// 		[width - maxRadius, height - maxRadius]
		// 	],
		// 	featureCollection
		// );
	});

	// let computePath = $derived(geoPath().projection(projection));
	const computeColor = scaleOrdinal(schemeCategory10);
	const computePie = d3pie()
		.sort(null)
		.value((d: any) => d);

	let land = $derived(
		feature(topology as unknown as Topology, topology.objects.land as GeometryCollection)
	);
	let countries = $derived(
		mesh(
			topology as unknown as Topology,
			topology.objects.countries as GeometryCollection,
			(a: GeometryObject, b: GeometryObject) => a !== b
		)
	);
	let regions = $derived(
		'regions' in topology.objects
			? mesh(
					topology as unknown as Topology,
					topology.objects.regions as GeometryCollection,
					(a: GeometryObject, b: GeometryObject) => a !== b
				)
			: null
	);

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}
		let computePath = geoPath(projection, ctx);

		const draw = () => {
			ctx.clearRect(0, 0, width, height);
			ctx.fillStyle = '#91a9cf';
			ctx.fillRect(0, 0, width, height);
			ctx.save();

			// Draw the map
			ctx.beginPath();
			computePath(land);
			ctx.clip();
			ctx.fillStyle = '#b3c497';
			ctx.fillRect(0, 0, width, height);

			ctx.beginPath();
			computePath(countries);
			ctx.strokeStyle = '#fff';
			ctx.stroke();

			if (regions) {
				ctx.beginPath();
				computePath(regions);
				ctx.strokeStyle = '#ccc';
				ctx.stroke();
			}
		};

		draw();
	});
</script>

<div>
	<canvas bind:this={canvas} {width} {height}></canvas>
</div>
