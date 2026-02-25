<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
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
		NODE_DISTANCE_BETWEEN,
		NODE_WIDTH,
		updateNodePosition,
		updateSankeyLayout
	} from '$lib/sankeyDiagram';
	import { pointer, select } from 'd3-selection';
	import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
	import { drag as d3drag, type DragBehavior } from 'd3-drag';
	import Tooltip from './Tooltip.svelte';
	import { debounce } from '$lib/debounce';
	import { sum } from 'd3';
	import ContentBox from './ContentBox.svelte';
	import HelpTooltip from './HelpTooltip.svelte';
	import { exportAsSVG } from '$lib/export';

	let width = $state(936);
	let height = $state(800);

	let svg = $state<SVGSVGElement>();

	export interface LegendItem {
		color: string;
		carrier: string;
	}

	interface Props {
		id?: string;
		nodes: Partial<SankeyNode>[];
		links: PartialSankeyLink[];
		legendItems?: LegendItem[];
	}

	let { id = 'diagram', nodes: initialNodes, links: initialLinks, legendItems }: Props = $props();

	let debounceLayoutDiagram = debounce(layoutDiagram, 100);

	$effect(() => {
		showStructureOnly;
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
			unitSuffix: node.unitSuffix ?? false,
			stickTo: node.stickTo ?? null,
			showTotal: node.showTotal ?? true,
			distinctRow: node.distinctRow ?? false,
			linksIn: [],
			linksOut: [],
			x: 0,
			y: 0,
			dy: 0
		}));
		fullLinks = partialLinks.flatMap((link) => {
			if (!showStructureOnly && link.value < 1e-6) {
				return [];
			}
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
		updateSankeyLayout(fullNodes, fullLinks, showStructureOnly);
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
			let ip_ny = CYCLE_LANE_NARROW_WIDTH, // northern y-coordinate of the inner path
				s_x = link.source.x + NODE_WIDTH,
				s_y = link.source.y + link.sy + link.dy,
				t_x = link.target.x,
				t_y = link.target.y,
				se_x = s_x + CYCLE_DIST_FROM_NODE,
				se_y = s_y,
				ne_x = se_x,
				n_y =
					-CYCLE_LANE_DIST_FROM_FWD_PATHS -
					link.cycleIndex * (ip_ny + CYCLE_LANE_SMALL_WIDTH_BUFFER), // above regular paths, in it's own 'cycle lane', with a buffer around it
				nw_x = t_x - CYCLE_DIST_FROM_NODE,
				sw_x = nw_x,
				sw_y = t_y + link.ty + link.dy,
				ip_se_y = se_y - link.dy,
				ip_sw_y = sw_y - link.dy,
				ip_cpd = CYCLE_CONTROL_POINT_DIST / 2 - CYCLE_LANE_NARROW_WIDTH; // inner path control point distance

			// If the target node is in the lower half, draw the cycle below the regular paths
			if (link.target.y > maxHeight / 2) {
				n_y = maxHeight - n_y;
				se_y = link.source.y + link.sy;
				sw_y = link.target.y + link.ty;
				ip_se_y = se_y + link.dy;
				ip_sw_y = sw_y + link.dy;
				ip_ny = -CYCLE_LANE_NARROW_WIDTH;
			}

			return (
				// outer path boundary
				`M${s_x},${se_y}` +
				`L${se_x},${se_y}` +
				`C${se_x + CYCLE_CONTROL_POINT_DIST},${se_y} ${ne_x + CYCLE_CONTROL_POINT_DIST},${n_y} ${ne_x},${n_y}` +
				`H${nw_x - CYCLE_LANE_NARROW_WIDTH}` +
				`C${nw_x - CYCLE_CONTROL_POINT_DIST},${n_y} ${sw_x - CYCLE_CONTROL_POINT_DIST},${sw_y} ${sw_x},${sw_y}` +
				`H${t_x}` +
				// inner path boundary
				`V${ip_sw_y}` +
				`H${sw_x}` +
				`C${sw_x - ip_cpd},${ip_sw_y} ${nw_x - ip_cpd},${n_y + ip_ny} ${nw_x},${n_y + ip_ny}` +
				`H${ne_x - CYCLE_LANE_NARROW_WIDTH}` +
				`C${ne_x + ip_cpd},${n_y + ip_ny} ${se_x + ip_cpd},${se_y - link.dy} ${se_x},${ip_se_y}` +
				`L${s_x},${ip_se_y}`
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
			CYCLE_LANE_DIST_FROM_FWD_PATHS +
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
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
		debounceLayoutDiagram();
	}

	onMount(handleSize);

	/**
	 * Resize observer to resize the diagram when the user resizes the container.
	 */
	const resizeObserver = new ResizeObserver(handleSize);
	onMount(() => {
		if (svg && svg.parentElement) {
			resizeObserver.observe(svg.parentElement);
		}
	});
	onDestroy(() => {
		resizeObserver.disconnect();
	});

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
		}) as unknown as ZoomBehavior<SVGSVGElement, unknown>;

	/**
	 * Update the zoom behavior's translate extent when the diagram content changes.
	 */
	$effect(() => {
		zoomBehavior = zoomBehavior.translateExtent([
			[minX - 5, -cycleLaneHeight - 5],
			[maxWidth + 5, maxHeight + cycleLaneHeight + 5]
		]);
	});

	/**
	 * Apply the zoom behavior to the SVG element after it is mounted.
	 */
	onMount(() => {
		if (!svg) return;
		select(svg).call(zoomBehavior);
	});

	/**
	 * Reset the zoom to the initial state.
	 */
	export function resetZoom() {
		if (!svg) return;
		select(svg).call(zoomBehavior.transform, zoomIdentity);
	}

	/**
	 * Focus the view on a specific carrier by zooming and centering on its node.
	 * @param carrier
	 */
	function focusCarrier(carrier: string) {
		// Find the target node by carrier label
		const targetNode = nodes.find((node) => node.label === carrier);
		if (!targetNode || !svg) return;

		// Compute the scale and translation to center the target node
		const rectWidth = 3 * NODE_WIDTH + 2 * NODE_DISTANCE_BETWEEN + 8;
		const scale = maxWidth / rectWidth;
		const translateX = -(targetNode.x + NODE_WIDTH / 2) * scale + maxWidth / 2;
		const translateY = -(targetNode.y + targetNode.dy / 2) * scale + maxHeight / 2;

		// Apply the zoom transformation
		const selection = select(svg as SVGSVGElement);
		zoomBehavior.transform(selection, zoomIdentity.translate(translateX, translateY).scale(scale));
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
		}) as unknown as DragBehavior<SVGRectElement, unknown, unknown>;

	/**
	 * Apply the drag behavior to the nodes after they are rendered.
	 */
	$effect(() => {
		nodes;
		if (!svg) return;
		select(svg).selectAll<SVGRectElement, unknown>('.node').call(dragBehavior);
	});

	/**
	 * Handle node drag events to update the node's y position.
	 * @param event
	 * @param idx
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function onDragNode(event: any, idx: number) {
		if (event.clientY === 0 || idx < 0 || idx >= nodes.length) return;
		const new_y = nodes[idx].y + event.dy;
		const constrained_y = Math.max(0, new_y);
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

	/**
	 * Generate a title string for a link.
	 * @param link
	 */
	function linkTitle(link: RawSankeyLink): string {
		return `${link.source.label} → ${link.target.label}:\n${link.value.toFixed(3)} ${link.unit}`;
	}

	// ===================
	// Show only structure
	// ===================

	let showStructureOnly = $state(false);

	export function getShowStructureOnly(): boolean {
		return showStructureOnly;
	}

	export function toggleShowStructureOnly() {
		showStructureOnly = !showStructureOnly;
	}

	// ===================
	// Download SVG
	// ===================

	export function downloadSVG() {
		if (!svg) return;
		exportAsSVG(svg, 'sankey_diagram.svg');
	}
</script>

<svelte:window onresize={handleSize} onscroll={updateSvgRect} />

<ContentBox class="flex">
	<h2 class="me-4 flex items-start text-lg font-bold">
		<span class="me-2">Legend</span>
		<HelpTooltip>Click on legend items to focus on into in the diagram.</HelpTooltip>
	</h2>
	{#if legendItems && legendItems.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each legendItems as item (item.carrier)}
				<button
					class="flex items-center p-0 text-sm text-gray-600 dark:text-gray-400"
					onclick={() => focusCarrier(item.carrier)}
				>
					<svg width="40" height="12" class="me-1">
						<rect width="40" height="12" fill={item.color} />
					</svg>
					<span>{item.carrier}</span>
				</button>
			{/each}
		</div>
	{/if}
</ContentBox>

<ContentBox noPadding>
	<div class="relative resize-y overflow-y-hidden">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<svg
			{id}
			class="max-w-full"
			{width}
			{height}
			bind:this={svg}
			viewBox={`${minX - 10} ${-cycleLaneHeight} ${maxWidth + 20} ${maxHeight + 2 * cycleLaneHeight + 20}`}
			onmousemove={updatePointerPosition}
			onmouseleave={() => (pointerPosition = null)}
			style:font="9px sans-serif"
		>
			<g {transform}>
				<g class="links">
					{#each links.toSorted((a, b) => b.value - a.value) as link, idx (idx)}
						{#if link.causesCycle}
							<path
								class="cycle-link"
								d={linkPath(link)}
								style:fill={link.color}
								stroke="none"
								style:opacity="0.3"
							>
								<title>{linkTitle(link)}</title>
							</path>
						{:else}
							<path
								class="link"
								d={linkPath(link)}
								fill="none"
								style:stroke-opacity="0.3"
								style:stroke={link.color}
								style:stroke-width={Math.max(1, link.dy)}
							>
								<title>{linkTitle(link)}</title>
							</path>
						{/if}
					{/each}
				</g>
				<g class="nodes">
					{#each nodes as node, idx (idx)}
						<g class="node" data-idx={idx}>
							<rect
								x={node.x}
								y={node.y + 0.5}
								width={NODE_WIDTH}
								height={Math.max(0.1, node.dy - 1)}
								fill={node.color}
								stroke="black"
								stroke-width="1"
							></rect>
							<text
								x={node.x + NODE_WIDTH / 2}
								y={node.dy > 16 ? node.y + node.dy / 2 : node.y - 2}
								class={[
									node.dy > 16 && (isDarkBackground(node.color) ? 'fill-white' : 'fill-black'),
									node.dy <= 16 && 'fill-black dark:fill-white'
								]}
								text-anchor="middle"
								dominant-baseline={node.dy > 16 ? 'middle' : 'auto'}
							>
								{node.label}
								{node.unitSuffix ? ` [${node.unit}]` : ''}
							</text>
						</g>
					{/each}
				</g>
			</g>
		</svg>
		<!-- Tooltip -->
		{#if activeNode !== null}
			<Tooltip
				x={tooltipX}
				y={tooltipY}
				yOffset={tooltipYOffset}
				isOnTop={tooltipOnTop}
				minX={0}
				maxX={width}
			>
				<div class="px-2 text-sm font-bold">
					{activeNode.label}
				</div>
				{#if activeNode.linksIn.length > 0}
					<div class={[activeNode.linksOut.length > 0 && 'border-b border-gray-400 pb-1']}>
						<div class="px-2 text-xs font-bold">Inflows:</div>
						{#each activeNode.linksIn as linkInIdx, idx (idx)}
							{#if links[linkInIdx].value}
								<div class="flex justify-between px-2 text-xs text-nowrap">
									<div class="me-1 flex items-center">
										<svg class="me-1" width="12" height="12">
											<rect width="12" height="12" fill={links[linkInIdx].source.color} />
										</svg>
										<span>{links[linkInIdx].source.label}:</span>
									</div>
									<div>
										{links[linkInIdx].value.toFixed(3)}
										{links[linkInIdx].unit}
									</div>
								</div>
							{/if}
						{/each}
						{#if activeNode.showTotal && activeNode.linksIn.length > 1}
							<div class="flex justify-between px-2 pt-1 text-xs text-nowrap">
								<strong>Total:</strong>
								<div>
									{sum(activeNode.linksIn.map((linkIdx) => links[linkIdx]?.value || 0)).toFixed(3)}
									{activeNode.unit}
								</div>
							</div>
						{/if}
					</div>
				{/if}
				{#if activeNode.linksOut.length > 0}
					<div class="mt-1 px-2 text-sm font-bold">Outflows:</div>
					{#each activeNode.linksOut as linkOutIdx, idx (idx)}
						{#if links[linkOutIdx].value}
							<div class="flex justify-between px-2 text-xs text-nowrap">
								<div class="me-1 flex items-center">
									<svg class="me-1" width="12" height="12">
										<rect width="12" height="12" fill={links[linkOutIdx].target.color} />
									</svg>
									<span>{links[linkOutIdx].target.label}:</span>
								</div>
								<div>
									{links[linkOutIdx].value.toFixed(3)}
									{links[linkOutIdx].unit}
								</div>
							</div>
						{/if}
					{/each}
					{#if activeNode.showTotal && activeNode.linksOut.length > 1}
						<div class="flex justify-between px-2 pt-1 text-xs text-nowrap">
							<strong>Total:</strong>
							<div>
								{sum(activeNode.linksOut.map((linkIdx) => links[linkIdx]?.value || 0)).toFixed(3)}
								{activeNode.unit}
							</div>
						</div>
					{/if}
				{/if}
			</Tooltip>
		{/if}
	</div>
</ContentBox>

<style>
	.node {
		cursor: row-resize;
	}

	.link:hover {
		stroke-opacity: 0.5 !important;
	}

	.cycle-link:hover {
		opacity: 0.5 !important;
	}
</style>
