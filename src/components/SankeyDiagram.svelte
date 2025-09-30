<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type {
		SankeyNode,
		SankeyLink,
		PartialSankeyLink,
		RawSankeyNode,
		RawSankeyLink
	} from '$lib/types';

	import {
		CYCLE_CONTROL_POINT_DIST,
		CYCLE_DIST_FROM_NODE,
		CYCLE_LANE_DIST_FROM_FWD_PATHS,
		CYCLE_LANE_NARROW_WIDTH,
		CYCLE_LANE_SMALL_WIDTH_BUFFER,
		getFinalNodesAndLinks,
		NODE_WIDTH,
		updateNodePosition,
		updateSankeyLayout
	} from '$lib/sankeyDiagram';
	import { pointer, select } from 'd3-selection';
	import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
	import { drag as d3drag } from 'd3-drag';
	import Tooltip from './Tooltip.svelte';
	import { debounce } from '$lib/debounce';
	import { sum } from 'd3';

	let width = $state(936);
	let height = $state(800);

	let svg = $state<SVGSVGElement>();

	interface Props {
		id?: string;
		nodes: Partial<SankeyNode>[];
		links: PartialSankeyLink[];
	}

	let { id = 'diagram', nodes: initialNodes, links: initialLinks }: Props = $props();

	let debounceLayoutDiagram = debounce(layoutDiagram, 100);

	$effect(() => {
		if (initialNodes.length) {
			untrack(() => {
				toFullNodesAndLinks(initialNodes, initialLinks);
				debounceLayoutDiagram();
			});
		}
	});

	// Full nodes and links with all properties initialized
	// It's not reactive, because it contains cyclic references
	let fullNodes: SankeyNode[] = [];
	let fullLinks: SankeyLink[] = [];

	// Final nodes and links with positions computed by the layout algorithm with Svelte reactivity
	let nodes: RawSankeyNode[] = $state([]);
	let links: RawSankeyLink[] = $state([]);

	/**
	 * Convert partial nodes and links to full nodes and links and initialize missing properties.
	 * @param partialNodes
	 * @param partialLinks
	 */
	function toFullNodesAndLinks(
		partialNodes: Partial<SankeyNode>[],
		partialLinks: PartialSankeyLink[]
	): void {
		fullNodes = partialNodes.map((node) => ({
			label: node.label ?? 'Unnamed',
			color: node.color ?? '#ccc',
			id: node.id ?? '',
			value: 0,
			unit: node.unit ?? '',
			linksIn: [],
			linksOut: [],
			x: 0,
			y: 0,
			dy: 0
		}));
		fullLinks = partialLinks.flatMap((link) => {
			let source = fullNodes.find((n) => n.id === link.source.id && n.label === link.source.label);
			let target = fullNodes.find((n) => n.id === link.target.id && n.label === link.target.label);
			if (!source || !target) {
				console.warn('Link refers to unknown node', link);
				return [];
			}
			return [
				{
					source,
					target,
					value: link.value,
					color: link.color,
					unit: link.unit,
					causesCycle: false,
					cycleIndex: 0,
					dy: 0,
					sy: 0,
					ty: 0
				}
			];
		});
	}

	/**
	 * Layout the diagram by computing node and link positions.
	 */
	function layoutDiagram() {
		updateSankeyLayout(fullNodes, fullLinks);
		[nodes, links] = getFinalNodesAndLinks();
	}

	/**
	 * Linear interpolation function between a and b.
	 * Returns a function that takes a parameter x and returns the interpolated value.
	 * If the parameter is not in [0, 1], the function will extrapolate on the line defined by a and b.
	 * @param a Point a
	 * @param b Point b
	 */
	function interpolateFn(a: number, b: number): (x: number) => number {
		return (x: number) => a * (1 - x) + b * x;
	}

	/**
	 * Generate the SVG path string for a link.
	 * If the link causes a cycle, draw it as a loop.
	 * Otherwise, draw it as a cubic Bezier curve.
	 * @param link
	 */
	function linkPath(link: RawSankeyLink): string {
		if (link.causesCycle) {
			/*
			The path will look like this, where
			s=source, t=target, ?q=quadratic focus point
			(wq)-> /-----n-----\
			       |w          |
			       |           e
			       \-t         |
							s--/ <-(eq)
			*/
			// Enclosed shape using curves and straight lines
			const smallWidth = CYCLE_LANE_NARROW_WIDTH,
				s_x = link.source.x + NODE_WIDTH,
				s_y = link.source.y + link.sy + link.dy,
				t_x = link.target.x,
				t_y = link.target.y,
				se_x = s_x + CYCLE_DIST_FROM_NODE,
				se_y = s_y,
				ne_x = se_x,
				ne_y =
					CYCLE_LANE_DIST_FROM_FWD_PATHS -
					link.cycleIndex * (smallWidth + CYCLE_LANE_SMALL_WIDTH_BUFFER), // above regular paths, in it's own 'cycle lane', with a buffer around it
				nw_x = t_x - CYCLE_DIST_FROM_NODE,
				nw_y = ne_y,
				sw_x = nw_x,
				sw_y = t_y + link.ty + link.dy,
				ip_cpd = CYCLE_CONTROL_POINT_DIST / 2 - CYCLE_LANE_NARROW_WIDTH; // inner path control point distance

			return (
				// outer path boundary
				`M${s_x},${s_y}` +
				`L${se_x},${se_y}` +
				`C${se_x + CYCLE_CONTROL_POINT_DIST},${se_y} ${ne_x + CYCLE_CONTROL_POINT_DIST},${ne_y} ${ne_x},${ne_y}` +
				`H${nw_x - smallWidth}` +
				`C${nw_x - CYCLE_CONTROL_POINT_DIST},${nw_y} ${sw_x - CYCLE_CONTROL_POINT_DIST},${sw_y} ${sw_x},${sw_y}` +
				`H${t_x}` +
				// inner path boundary
				`V${t_y + link.ty}` +
				`H${sw_x}` +
				`C${sw_x - ip_cpd},${t_y} ${nw_x - ip_cpd},${nw_y + smallWidth} ${nw_x},${nw_y + smallWidth}` +
				`H${ne_x - smallWidth}` +
				`C${ne_x + ip_cpd},${ne_y + smallWidth} ${se_x + ip_cpd},${se_y - link.dy} ${se_x},${se_y - link.dy}` +
				`L${s_x},${s_y - link.dy}`
			);
		}

		const x0 = link.source.x + NODE_WIDTH;
		const x1 = link.target.x;
		const xi = interpolateFn(x0, x1);
		const xm = xi(0.5);
		const y0 = link.source.y + link.sy + link.dy / 2;
		const y1 = link.target.y + link.ty + link.dy / 2;
		return `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1}`;
	}

	// ==============
	// Derived values
	// ==============

	/**
	 * Height offset for the cycle lane, based on the maximum cycle index of the links.
	 * If there are no cycles, the offset is 0.
	 */
	let cycleLaneHeight = $derived.by(() => {
		if (!links.length) return 0;
		const maxCycleIndex = Math.max(...links.map((link) => link.cycleIndex));
		if (maxCycleIndex == 0) return 0;
		return (
			CYCLE_LANE_DIST_FROM_FWD_PATHS -
			maxCycleIndex * (CYCLE_LANE_NARROW_WIDTH + CYCLE_LANE_SMALL_WIDTH_BUFFER)
		);
	});

	/**
	 * Compute the maximum x and y coordinates of the diagram based on the final node positions.
	 * Add some padding to avoid clipping.
	 */
	let minX = $derived.by(() => {
		if (!nodes.length) return 0;
		// If there are cycles to nodes in the first level, shift the viewbox to the left to avoid clipping
		if (nodes.some((node) => node.x === 0 && node.linksIn.length > 0)) {
			return -CYCLE_DIST_FROM_NODE - CYCLE_LANE_NARROW_WIDTH - CYCLE_CONTROL_POINT_DIST;
		}
		return 0;
	});
	let maxWidth = $derived.by(() => {
		if (!nodes.length) return width;
		const max = Math.max(...nodes.map((node) => node.x + NODE_WIDTH));
		// If there are cycles to nodes in the last level, extend the viewbox to the right to avoid clipping
		if (nodes.some((node) => node.x === max && node.linksOut.length > 0)) {
			return max + CYCLE_DIST_FROM_NODE + CYCLE_LANE_NARROW_WIDTH + CYCLE_CONTROL_POINT_DIST - minX;
		}
		return max - minX;
	});
	let maxHeight = $derived.by(() => {
		if (!nodes.length) return height;
		return Math.max(...nodes.map((node) => node.y + node.dy));
	});

	/**
	 * Round a value to the specified number of decimal places.
	 * @param value Value to round
	 * @param number_of_decimal_places Number of decimal places (default: 6)
	 * @returns Rounded value
	 */
	function roundValue(value: number, number_of_decimal_places: number = 6): number {
		const factor = 10 ** number_of_decimal_places;
		return Math.round(value * factor) / factor;
	}

	function isDarkBackground(color: string): boolean {
		// Parse the rgb color
		let r: number, g: number, b: number;
		let regex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
		const match = color.match(regex);
		if (match) {
			r = parseInt(match[1], 10);
			g = parseInt(match[2], 10);
			b = parseInt(match[3], 10);
		} else {
			// Invalid format
			return false;
		}

		// Calculate the luminance using the formula from: https://www.w3.org/TR/AERT/#color-contrast
		const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

		// Define that a color is dark if its luminance is less than this threshold
		return luminance < 85;
	}

	// ===================
	// Responsive behavior
	// ===================

	/**
	 * Handle window resize events by updating the SVG dimensions and re-layout the diagram.
	 */
	function handleSize() {
		if (!svg) return;
		const { width: w } = svg.parentElement!.getBoundingClientRect();
		width = w;
		debounceLayoutDiagram();
	}

	onMount(handleSize);

	// ===================================
	// Zoom and pan behavior using d3-zoom
	// ===================================

	/**
	 * Zoom behavior using d3-zoom.
	 */
	let transform: string = $state(zoomIdentity.toString());
	let zoomBehavior = d3zoom()
		.scaleExtent([1, Infinity])
		.on('zoom', (event) => {
			transform = event.transform.toString();
			updateActiveNodeRect();
		})
		.on('end', () => {
			updateActiveNodeRect();
		});

	/**
	 * Update the zoom behavior's translate extent when the diagram content changes.
	 */
	$effect(() => {
		zoomBehavior = zoomBehavior.translateExtent([
			[minX - 5, cycleLaneHeight - 5],
			[maxWidth + 5, maxHeight + 5]
		]);
	});

	/**
	 * Apply the zoom behavior to the SVG element after it is mounted.
	 */
	onMount(() => {
		if (!svg) return;
		select(svg).call(zoomBehavior as any);
	});

	/**
	 * Reset the zoom to the initial state.
	 */
	function resetZoom() {
		if (!svg) return;
		select(svg).call(zoomBehavior.transform as any, zoomIdentity);
	}

	// ==================
	// Drag node behavior
	// ==================

	/**
	 * Drag behavior using d3-drag.
	 */
	let dragBehavior = d3drag()
		.on('start', function () {
			if (!this.parentNode) return;
			this.parentNode.appendChild(this);
		})
		.on('drag', function (event) {
			const idx = Number((this as SVGGElement).dataset.idx);
			if (isNaN(idx)) return;
			onDragNode(event, idx);
			updatePointerPosition(event);
		});

	/**
	 * Apply the drag behavior to the nodes after they are rendered.
	 */
	$effect(() => {
		nodes;
		if (!svg) return;
		select(svg)
			.selectAll<SVGRectElement, unknown>('.node')
			.call(dragBehavior as any);
	});

	/**
	 * Handle node drag events to update the node's y position.
	 * @param event
	 * @param idx
	 */
	function onDragNode(event: any, idx: number) {
		if (event.clientY === 0 || idx < 0 || idx >= nodes.length) return;
		const new_y = nodes[idx].y + event.dy;
		const constrained_y = Math.max(0, Math.min(height - nodes[idx].dy, new_y));
		updateNodePosition(idx, constrained_y);
		[nodes, links] = getFinalNodesAndLinks();
	}

	// ================
	// Tooltip behavior
	// ================

	/**
	 * Track the mouse pointer position relative to the SVG element.
	 */
	let pointerPosition: [number, number] | null = $state(null);
	function updatePointerPosition(event: MouseEvent) {
		if (!svg) return;
		pointerPosition = pointer(event, svg.parentElement);
	}

	/**
	 * Bounding client rect of the SVG element, used to compute the tooltip position.
	 */
	let svgRect: DOMRect | null = $state(null);
	function updateSvgRect() {
		if (!svg) return;
		svgRect = svg.getBoundingClientRect();
	}
	onMount(updateSvgRect);

	/**
	 * The currently active node under the mouse pointer, or null if none.
	 * Also compute the bounding rect of the active node for tooltip positioning.
	 */
	let activeNode: RawSankeyNode | null = $derived.by(() => {
		if (!pointerPosition || !svg) return null;
		let [x, y] = pointerPosition;
		let svgRect = svg.getBoundingClientRect();
		let lastNode = select(svg)
			.selectAll<SVGRectElement, unknown>('.node')
			.nodes()
			.findLast((node) => {
				let rect = node.getBoundingClientRect();
				let nodeX = rect.left - svgRect.left;
				let nodeY = rect.top - svgRect.top;
				return x >= nodeX && x <= nodeX + rect.width && y >= nodeY && y <= nodeY + rect.height;
			});
		if (!lastNode) return null;
		let idx = Number(lastNode.dataset.idx);
		if (isNaN(idx) || idx < 0 || idx >= nodes.length) return null;
		return nodes[idx];
	});
	let activeNodeRect: DOMRect | null = $state(null);
	function updateActiveNodeRect() {
		if (activeNode === null || !svg) return;
		const idx = nodes.findIndex((n) => n === activeNode);
		if (idx === -1) return;
		const node = select(svg)
			.selectAll<SVGRectElement, unknown>(`.node[data-idx="${idx}"]`)
			.nodes()[0];
		if (!node) return;
		activeNodeRect = node.getBoundingClientRect();
	}
	$effect(updateActiveNodeRect);

	/**
	 * Compute the tooltip position based on the active node's bounding rect.
	 * The tooltip is centered horizontally above the node, with a vertical offset.
	 * If the node is in the upper half of the SVG, the tooltip is shown below the node instead.
	 */
	let tooltipX = $derived.by(() => {
		if (activeNodeRect === null || svgRect === null) return 0;
		return activeNodeRect.left - svgRect.left + activeNodeRect.width / 2;
	});
	let tooltipY = $derived.by(() => {
		if (activeNodeRect === null || svgRect === null) return 0;
		return activeNodeRect.top - svgRect.top + activeNodeRect.height / 2;
	});
	let tooltipYOffset = $derived.by(() => {
		if (activeNodeRect === null) return 0;
		return activeNodeRect.height / 2;
	});
	let tooltipOnTop = $derived.by(() => {
		if (activeNodeRect === null || svgRect === null) return false;
		return activeNodeRect.top - svgRect.top > height / 2;
	});
</script>

<svelte:window onresize={handleSize} onscroll={updateSvgRect} />

<div class="position-relative border rounded">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		{id}
		{width}
		{height}
		bind:this={svg}
		viewBox={`${minX - 1} ${cycleLaneHeight} ${maxWidth + 4} ${maxHeight}`}
		onmousemove={updatePointerPosition}
		onmouseleave={() => (pointerPosition = null)}
	>
		<g {transform}>
			<g class="links">
				{#each links.toSorted((a, b) => b.value - a.value) as link}
					{#if link.causesCycle}
						<path class="cycle-link" d={linkPath(link)} style:fill={link.color}></path>
					{:else}
						<path
							class="link"
							d={linkPath(link)}
							style:stroke={link.color}
							style:stroke-width={Math.max(1, link.dy)}
						></path>
					{/if}
				{/each}
			</g>
			<g class="nodes">
				{#each nodes as node, idx}
					<g class="node" data-idx={idx}>
						<rect
							x={node.x}
							y={node.y + 1}
							width={NODE_WIDTH}
							height={Math.max(0.1, node.dy - 2)}
							fill={node.color}
						></rect>
						<text
							x={node.x + NODE_WIDTH / 2}
							y={node.dy > 16 ? node.y + node.dy / 2 : node.y - 2}
							text-anchor="middle"
							dominant-baseline={node.dy > 16 ? 'middle' : 'auto'}
							fill={node.dy > 16 && isDarkBackground(node.color) ? '#fff' : '#000'}
						>
							{node.label}
						</text>
					</g>
				{/each}
			</g>
		</g>
	</svg>
	<!-- Reset zoom button -->
	<div class="position-absolute top-0 end-0 m-2">
		<button class="btn btn-secondary" onclick={resetZoom}>
			<i class="bi bi-house"></i>
			<div class="visually-hidden">Reset zoom</div>
		</button>
	</div>
	<!-- Tooltip -->
	{#if activeNode !== null}
		<Tooltip x={tooltipX} y={tooltipY} yOffset={tooltipYOffset} isOnTop={tooltipOnTop}>
			{#snippet content()}
				<div class="fw-bold fs-7 px-2">
					{activeNode.label}
				</div>
				{#if activeNode.linksIn.length > 0}
					<div class="fw-bold mt-1 fs-7 px-2">Inflows:</div>
					{#each activeNode.linksIn as linkInIdx}
						{#if links[linkInIdx]}
							<div class="fs-8 px-2 text-no-break">
								<svg width="12" height="12">
									<rect width="12" height="12" fill={links[linkInIdx].source.color} />
								</svg>
								{links[linkInIdx].source.label}: {roundValue(links[linkInIdx].value)}
								{links[linkInIdx].unit}
							</div>
						{/if}
					{/each}
					<div
						class={[
							'fs-8 px-2 text-no-break',
							activeNode.linksOut.length > 0 && 'border-bottom border-secondary pb-1'
						]}
					>
						<strong>Total:</strong>
						{roundValue(sum(activeNode.linksIn.map((linkIdx) => links[linkIdx]?.value || 0)))}
						{activeNode.unit}
					</div>
				{/if}
				{#if activeNode.linksOut.length > 0}
					<div class="fw-bold mt-1 fs-7 px-2">Outflows:</div>
					{#each activeNode.linksOut as linkOutIdx}
						{#if links[linkOutIdx]}
							<div class="fs-8 px-2 text-no-break">
								<svg width="12" height="12">
									<rect width="12" height="12" fill={links[linkOutIdx].target.color} />
								</svg>
								{links[linkOutIdx].target.label}: {roundValue(links[linkOutIdx].value)}
								{links[linkOutIdx].unit}
							</div>
						{/if}
					{/each}
					<div class="fs-8 px-2 text-no-break">
						<strong>Total:</strong>
						{roundValue(sum(activeNode.linksOut.map((linkIdx) => links[linkIdx]?.value || 0)))}
						{activeNode.unit}
					</div>
				{/if}
			{/snippet}
		</Tooltip>
	{/if}
</div>

<style>
	svg {
		font: 9px sans-serif;
	}

	.node {
		cursor: row-resize;
	}

	.node rect {
		stroke: #000;
		stroke-width: 2px;
	}

	.link {
		fill: none;
		stroke: #000;
		stroke-opacity: 0.3;
	}

	.link:hover {
		stroke-opacity: 0.5;
	}

	.cycle-link {
		opacity: 0.3;
		stroke: none;
		stroke-linejoin: round;
	}

	.cycle-link:hover {
		opacity: 0.5;
	}

	.fs-7 {
		font-size: 0.875rem;
	}
	.fs-8 {
		font-size: 0.75rem;
	}

	.text-no-break {
		white-space: nowrap;
	}
</style>
