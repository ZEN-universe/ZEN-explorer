<script lang="ts">
	import { geoMercator, geoPath } from 'd3-geo';
	import { scaleOrdinal } from 'd3-scale';
	import { pointer, select } from 'd3-selection';
	import { pie as d3pie, arc as d3arc } from 'd3-shape';
	import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { feature, mesh } from 'topojson-client';
	import type { ExtendedFeatureCollection } from 'd3-geo';
	import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
	import { all_colors } from '$lib/colors';

	let topology: Topology | null = $state(null);
	$effect(() => {
		if (!map) return;

		import(`../topojson/${map}.json`)
			.then((response) => {
				topology = response.default;
			})
			.catch((err) => {
				console.error(`Error loading topology for ${map}:`, err);
			});
	});

	export interface DataRow {
		technology: string;
		value: number;
	}
	export interface MapPlotData {
		[node: string]: DataRow[];
	}

	interface Props {
		id?: string;
		pieData: MapPlotData;
		lineData?: MapPlotData;
		nodeCoords?: { [node: string]: [number, number] };
		unit: string;
		map: string | null;
		minTotal: number;
		maxTotal: number;
		minEdge: number;
		maxEdge: number;
	}
	let {
		id = 'map',
		pieData,
		lineData = {},
		nodeCoords = {},
		unit,
		map,
		minTotal,
		maxTotal,
		minEdge,
		maxEdge
	}: Props = $props();

	// SVG element
	let svg: SVGSVGElement;

	// Constants
	const minRadius = 7;
	const maxRadius = 40;
	const minLineWidth = 1;
	const maxLineWidth = 8;

	// Map elements
	let width = $state(936);
	let height = $state(800);
	let zoomScale = $state(1);
	let zoomX = $state(0);
	let zoomY = $state(0);

	let initialProjection = $derived.by(() => {
		const usedNodes = new Set(
			Object.keys(pieData).concat(Object.keys(lineData).flatMap((d) => d.split('-')))
		);
		const filteredNodeCoords = Object.entries(nodeCoords).filter(([key, _]) => usedNodes.has(key));

		if (!nodeCoords || filteredNodeCoords.length == 0) {
			// Default projection for the world map
			return {
				scale: 1100,
				translateX: 400,
				translateY: 1500
			};
		} else if (filteredNodeCoords.length == 1) {
			// Single node projection
			const tempProjection = geoMercator().scale(800).translate([0, 0]);
			const point = tempProjection(filteredNodeCoords[0][1])!;
			return {
				scale: tempProjection.scale(),
				translateX: width / 2 - point[0],
				translateY: height / 2 - point[1]
			};
		}

		const featureCollection: ExtendedFeatureCollection = {
			type: 'FeatureCollection',
			features: filteredNodeCoords.map(([_, coords]) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: coords
				},
				properties: {}
			}))
		};
		const padding = 1.5 * maxRadius;
		const projection = geoMercator().fitExtent(
			[
				[padding, padding],
				[width - padding, height - padding]
			],
			featureCollection
		);

		return {
			scale: projection.scale(),
			translateX: projection.translate()[0],
			translateY: projection.translate()[1]
		};
	});
	let projection = $derived.by(() => {
		return geoMercator()
			.translate([
				initialProjection.translateX * zoomScale + zoomX,
				initialProjection.translateY * zoomScale + zoomY
			])
			.scale(initialProjection.scale * zoomScale);
	});

	let computePath = $derived(geoPath().projection(projection));
	const computeColor = scaleOrdinal(all_colors());
	const computePie = d3pie()
		.sort(null)
		.value((d: any) => d);

	let land: string | null = $derived.by(() => {
		if (!topology) return null;
		return computePath(
			feature(topology as unknown as Topology, topology.objects.land as GeometryCollection)
		);
	});
	let countries: string | null = $derived.by(() => {
		if (!topology) return null;
		return computePath(
			mesh(
				topology as unknown as Topology,
				topology.objects.countries as GeometryCollection,
				(a: GeometryObject, b: GeometryObject) => a !== b
			)
		);
	});
	let regions: string | null = $derived.by(() => {
		if (!topology || !('regions' in topology.objects)) return null;
		return computePath(
			mesh(
				topology as unknown as Topology,
				topology.objects.regions as GeometryCollection,
				(a: GeometryObject, b: GeometryObject) => a !== b
			)
		);
	});

	// Zoom
	let zoom = $derived(d3zoom().filter(shouldHandleZoom).on('zoom', onZoom));
	onMount(() => {
		if (!svg) return;
		select(svg)
			.call(zoom as any)
			.call(zoom.transform as any, zoomIdentity);
	});

	function shouldHandleZoom(event: MouseEvent | WheelEvent) {
		// Ignore right-click, since that should open the context menu
		// and ctrl + left-click, since that is used for drag-to-zoom.
		// Exception for pinch-to-zoom, which is sent as a wheel+ctrlKey event.
		return (
			event.button == 0 &&
			!(event.ctrlKey && event.button === 0) &&
			!(event.ctrlKey && event.type !== 'wheel')
		);
	}

	function onZoom(event: D3ZoomEvent<SVGSVGElement, unknown>) {
		const { transform } = event;
		zoomScale = transform.k;
		zoomX = transform.x;
		zoomY = transform.y;
	}

	let drawRectangle = $state(false);
	let startPos = $state([0, 0]);
	let endPos = $state([0, 0]);

	function startZoomRectangle(event: MouseEvent) {
		if (event.button !== 0) return; // Only left mouse button
		drawRectangle = true;
		startPos = pointer(event, svg);
		endPos = startPos;
	}

	function moveZoomRectangle(event: MouseEvent) {
		if (!drawRectangle) return;
		endPos = pointer(event, svg);
	}

	function endZoomRectangle(event: MouseEvent) {
		if (!drawRectangle) return;
		drawRectangle = false;

		// Calculate the rectangle's width and height
		const endPos = pointer(event, svg);
		const [startX, startY] = startPos;
		const [endX, endY] = endPos;
		const rectWidth = Math.abs(startX - endX);
		const rectHeight = Math.abs(startY - endY);
		if (rectWidth === 0 || rectHeight === 0) return;

		// Calculate the scale as the minimal ratio of the rectangle dimensions to the SVG dimensions
		const scaleX = width / rectWidth;
		const scaleY = height / rectHeight;
		const scale = Math.min(scaleX, scaleY);

		// Calculate the translation to center the rectangle in the SVG
		const x = Math.min(startX, endX) + rectWidth / 2;
		const y = Math.min(startY, endY) + rectHeight / 2;
		const translateX = (zoomX - x) * scale + width / 2;
		const translateY = (zoomY - y) * scale + height / 2;

		// Apply the zoom transformation
		const selection = select(svg as Element);
		zoom.transform(
			selection,
			zoomIdentity.translate(translateX, translateY).scale(zoomScale * scale)
		);
	}

	function cancelZoomRectangle() {
		drawRectangle = false;
	}

	export function resetZoom() {
		zoomScale = 1;
		zoomX = 0;
		zoomY = 0;
		select(svg).call(zoom.transform as any, zoomIdentity);
	}

	// Data dependent values
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

	// Tooltip
	let cursorPos: [number, number] = $state([0, 0]);
	let activePie: Pie | undefined = $derived.by(() => {
		return findPie(cursorPos);
	});
	let activeLines: Line[] = $derived.by(() => {
		if (activePie) return [];
		return filterLines(cursorPos);
	});

	let tooltipX = $derived.by(() => {
		if (activePie) return activePie.x;
		else if (activeLines.length > 0) return 0.5 * (activeLines[0].start[0] + activeLines[0].end[0]);
		return 0;
	});
	let tooltipY = $derived.by(() => {
		if (activePie) return activePie.y;
		else if (activeLines.length > 0) return 0.5 * (activeLines[0].start[1] + activeLines[0].end[1]);
		return 0;
	});
	let tooltipYOffset = $derived.by(() => 5 + (activePie ? computeRadius(activePie.total) : 0));
	let tooltipOnTop = $derived.by(() => tooltipY - tooltipYOffset > 180);

	function updateActiveElements(event: MouseEvent) {
		cursorPos = pointer(event);
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
			// Check if the given position is within the line segment
			// using the distance from point to line segment formula
			// Let a be the start point, b be the end point, and p be the point
			// The distance from p to the line segment ab is given by:
			// dist(a, b, p) = |p-a|² - ((p-a) x (b-a))² / |b-a|²
			// where x is the dot product and | | is the euclidean length of the vector

			let [x1, y1] = line.start!;
			let [x2, y2] = line.end!;

			const ax = px - x1;
			const ay = py - y1;
			const bx = x2 - x1;
			const by = y2 - y1;

			const adotb = ax * bx + ay * by;
			const bSquared = Math.pow(bx, 2) + Math.pow(by, 2);
			// Abort if the projection of p is outside the line segment,
			// i.e. if adotb is not in [0, bSquared], or if the line segment is too small
			if (adotb < 0 || adotb > bSquared || bSquared < 1e-10) return false;

			const distSquared = Math.pow(ax, 2) + Math.pow(ay, 2) - Math.pow(adotb, 2) / bSquared;
			return 4 * distSquared < Math.pow(maxLineWidth, 2);
		});
	}

	onMount(handleSize);

	function handleSize() {
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
	}

	function computeRadius(total: number) {
		if (maxTotal == minTotal) {
			return maxRadius;
		}
		return minRadius + ((total - minTotal) / (maxTotal - minTotal)) * (maxRadius - minRadius);
	}

	function computeEdgeWidth(total: number) {
		if (maxEdge == minEdge) {
			return maxLineWidth;
		}
		return minLineWidth + ((total - minEdge) / (maxEdge - minEdge)) * (maxLineWidth - minLineWidth);
	}

	function straightLine(start: [number, number], end: [number, number]) {
		const [x1, y1] = start;
		const [x2, y2] = end;
		return `M${x1},${y1} L${x2},${y2}`;
	}
</script>

<svelte:window on:resize={handleSize} />

<div class="position-relative">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		{width}
		{height}
		bind:this={svg}
		onmousemove={(event) => {
			updateActiveElements(event);
			moveZoomRectangle(event);
		}}
		onmousedown={startZoomRectangle}
		onmouseup={endZoomRectangle}
		onmouseleave={cancelZoomRectangle}
		{id}
		style:background="rgb(168, 186, 215)"
	>
		{#if !topology}
			<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Loading...</text>
		{:else}
			<g>
				<path d={land} style:fill="rgb(195, 208, 174)" />
				{#if regions != null}
					<path d={regions} fill="none" stroke="#d3d3d3" stroke-width="1px" />
				{/if}
				<path
					d={countries}
					fill="none"
					stroke="white"
					stroke-width={regions == null ? '1px' : '2px'}
				/>
			</g>
			<g>
				{#each lines as line}
					<path d={straightLine(line.start, line.end)} stroke="#666" stroke-width={line.width} />
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
		{/if}
		{#if drawRectangle}
			<rect
				x={Math.min(startPos[0], endPos[0])}
				y={Math.min(startPos[1], endPos[1])}
				width={Math.abs(startPos[0] - endPos[0])}
				height={Math.abs(startPos[1] - endPos[1])}
				stroke="black"
				stroke-width="1"
				fill="rgba(255, 255, 255, 0.5)"
			/>
		{/if}
	</svg>
	<!-- Legend -->
	{#if technologies.length > 0}
		<div class="position-absolute bottom-0 end-0 m-2 p-2 bg-black bg-opacity-75 text-white pe-none">
			<h5 class="visually-hidden">Legend</h5>
			{#each technologies as t}
				<div class="d-flex align-items-center">
					<svg width="16" height="16" class="me-1">
						<rect width="16" height="16" fill={computeColor(t)} />
					</svg>
					{t}
				</div>
			{/each}
		</div>
	{/if}
	<!-- Reset zoom button -->
	{#if topology}
		<div class="position-absolute top-0 end-0 m-2">
			<button class="btn btn-secondary" onclick={resetZoom}>
				<i class="bi bi-house"></i>
				<div class="visually-hidden">Reset zoom</div>
			</button>
		</div>
	{/if}
	<!-- Tooltip -->
	{#if activePie || activeLines.length > 0}
		<div
			class="position-absolute bg-black bg-opacity-75 text-white py-2 rounded fs-8 pe-none"
			style:top={tooltipOnTop ? `${tooltipY - tooltipYOffset}px` : `${tooltipY + tooltipYOffset}px`}
			style:left={`${tooltipX}px`}
			style:transform={tooltipOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
			style:min-width="200px"
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
			{#if activePie}
				<h5 class="fs-7 mb-0 px-2">{activePie.label}</h5>
				{#each activePie.data as d}
					<div class="px-2">
						<svg width="16" height="16">
							<rect width="16" height="16" fill={d.color} />
						</svg>
						{d.technology}: {d.value.toFixed(3)}
						{unit}
					</div>
				{/each}
				{#if activePie.data.length > 1}
					<div class="px-2">
						<strong>Total: {activePie.total.toFixed(3)} {unit}</strong>
					</div>
				{/if}
			{:else if activeLines.length > 0}
				{#each activeLines as line, i}
					<div class={['px-2', i > 0 && 'border-top border-secondary mt-1 pt-1']}>
						<h5 class="fs-7 mb-0">{line.label}</h5>
						{#each line.values as d}
							<div>
								{d.technology}: {d.value.toFixed(3)}
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
	.fs-7 {
		font-size: 0.875rem;
	}
	.fs-8 {
		font-size: 0.75rem;
	}
</style>
