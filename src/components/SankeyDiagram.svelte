<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { SankeyNode, SankeyLink } from '$lib/types';

	// Source: https://gist.github.com/cfergus/3956043 and https://gist.github.com/soxofaan/bb6f91d57dc4b6afe91d

	const NODE_WIDTH = 100;
	const NODE_PADDING = 8;
	const ITERATIONS = 256;

	let width = $state(936);
	let height = $state(600);

	let svg = $state<SVGSVGElement>();

	let nodes: SankeyNode[] = [];
	let links: SankeyLink[] = [];

	interface SankeyNodeRaw {
		label: string;
		color: string;
		value: number;
		x: number;
		y: number;
		dy: number;
	}

	interface SankeyLinkRaw {
		source: SankeyNodeRaw;
		target: SankeyNodeRaw;
		value: number;
		causesCycle: boolean;
		cycleIndex: number;
		dy: number;
		sy: number;
		ty: number;
	}

	let rawNodes: SankeyNodeRaw[] = $state([]);
	let rawLinks: SankeyLinkRaw[] = $state([]);

	export function setNodes(initNodes: SankeyNode[]) {
		nodes = initNodes;
		links = nodes.flatMap((node) => node.linksOut);

		computeNodeValues();
		markCycles();
		computeNodeBreadths();
		computeNodeDepths();
		computeLinkDepths();

		console.log('nodes', nodes);

		rawNodes = nodes.map((node) => ({
			label: node.label,
			color: node.color,
			value: node.value ?? 0,
			x: node.x ?? 0,
			y: node.y ?? 0,
			dy: node.dy ?? 0
		}));
		rawLinks = links.map((link) => ({
			source: rawNodes[nodes.indexOf(link.source)],
			target: rawNodes[nodes.indexOf(link.target)],
			value: link.value,
			causesCycle: link.causesCycle ?? false,
			cycleIndex: link.cycleIndex ?? -1,
			dy: link.dy ?? 0,
			sy: link.sy ?? 0,
			ty: link.ty ?? 0
		}));
	}

	/**
	 * Compute the value of each node as the maximum of incoming and outgoing link values.
	 * Ideally, the incoming and outgoing link values should be equal,
	 */
	function computeNodeValues() {
		nodes.forEach((node) => {
			node.value = Math.max(
				node.linksIn.reduce((sum, link) => sum + link.value, 0),
				node.linksOut.reduce((sum, link) => sum + link.value, 0)
			);
		});
	}

	/**
	 * Iterate over all links iteratively and check if adding them would create a cycle.
	 * If so, mark them as causing a cycle.
	 *
	 * This naïve algorithm runs in O(n²), but works well enough for small graphs.
	 */
	function markCycles() {
		var nextCycleIndex = 0;
		var addedLinks = [] as SankeyLink[];
		links.forEach((link) => {
			if (createsCycle(link.source, link.target, addedLinks)) {
				link.causesCycle = true;
				link.cycleIndex = nextCycleIndex++;
			} else {
				link.causesCycle = false;
				addedLinks.push(link);
			}
		});
	}

	/**
	 * Iterate over the graph recursively (depth-first) to check
	 * if adding a link from currentNode to initialNode would create a cycle.
	 *
	 * Assumes that the graph is a Directed Acyclic Graph (DAG) up to this point.
	 */
	function createsCycle(
		initialNode: SankeyNode,
		currentNode: SankeyNode,
		graph: SankeyLink[]
	): boolean {
		// find all links for which this node is a source in the current 'known' graph
		var nextLinks = graph.filter((link) => link.source === currentNode);

		// base cases
		if (graph.length == 0 || nextLinks.length == 0) return false;

		// cycle check
		return nextLinks.some(
			(link) => link.target === initialNode || createsCycle(initialNode, link.target, graph)
		);
	}

	/**
	 * Compute the horizontal position (breadth) of each node.
	 * Nodes are assigned to levels based on their distance from source nodes.
	 * Finally, the breadths are scaled to fit within the available width.
	 */
	function computeNodeBreadths() {
		let remainingNodes = nodes;
		let nextNodes: SankeyNode[] = [];
		let currentBreadth = 0;

		while (remainingNodes.length) {
			nextNodes = [];
			remainingNodes.forEach((node) => {
				node.x = currentBreadth;
				node.linksOut.forEach((link) => {
					if (link.causesCycle) return;
					nextNodes.push(link.target);
				});
			});
			remainingNodes = nextNodes;
			currentBreadth++;
		}

		// moveSinks(currentLevel - 1);
		scaleNodeBreadths((width - NODE_WIDTH) / (currentBreadth - 1));
	}

	/**
	 * Move all sink nodes to the given position.
	 */
	function moveSinks(x: number) {
		nodes.forEach((node) => {
			if (node.linksOut.length > 0) return;
			node.x = x;
		});
	}

	/**
	 * Scale the breadths of all nodes by the given factor.
	 */
	function scaleNodeBreadths(kx: number) {
		nodes.forEach((node) => {
			node.x *= kx;
		});
	}

	/**
	 * Return an array of nodes grouped by their breadth (x position).
	 */
	function nodesGroupedByBreadth() {
		let nodesByBreadth: { [key: number]: SankeyNode[] } = {};
		nodes.forEach((node) => {
			const breadth = node.x;
			if (!nodesByBreadth[breadth]) nodesByBreadth[breadth] = [];
			nodesByBreadth[breadth].push(node);
		});
		return Object.values(nodesByBreadth).sort((a, b) => a[0].x - b[0].x);
	}

	/**
	 * Return the vertical center of a node.
	 */
	function center(node: SankeyNode) {
		return node.y + node.dy / 2;
	}

	/**
	 * Compute the vertical position (depth) of each node.
	 * Nodes are assigned initial depths based on their value and then
	 * adjusted iteratively to minimize link crossings and node overlaps.
	 */
	function computeNodeDepths() {
		let nodesByBreadth = nodesGroupedByBreadth();

		initializeNodeDepth();
		resolveCollisions();
		for (let alpha = 1, i = ITERATIONS; i > 0; --i) {
			relaxRightToLeft((alpha *= 0.99));
			resolveCollisions();
			relaxLeftToRight(alpha);
			resolveCollisions();
		}

		function initializeNodeDepth() {
			var ky = Math.min(
				...nodesByBreadth.map((nodes) => {
					return (
						(height - (nodes.length - 1) * NODE_PADDING) /
						nodes.reduce((sum, n) => sum + n.value, 0)
					);
				})
			);

			nodesByBreadth.forEach((nodes) => {
				nodes.forEach((node, i) => {
					node.y = i;
					node.dy = node.value * ky;
				});
			});

			links.forEach((link) => {
				link.dy = link.value * ky;
			});
		}

		function relaxLeftToRight(alpha: number) {
			nodesByBreadth.forEach((nodes) => {
				nodes.forEach((node) => {
					if (node.linksIn.length == 0) return;
					const y =
						node.linksIn.reduce((sum, n) => sum + weightedSource(n), 0) /
						node.linksIn.reduce((sum, n) => sum + n.value, 0);
					node.y = node.y + (y - center(node)) * alpha;
				});
			});

			function weightedSource(link: SankeyLink) {
				return center(link.source) * link.value;
			}
		}

		function relaxRightToLeft(alpha: number) {
			nodesByBreadth
				.slice()
				.reverse()
				.forEach((nodes) => {
					nodes.forEach((node) => {
						if (node.linksOut.length == 0) return;
						const y =
							node.linksOut.reduce((sum, n) => sum + weightedTarget(n), 0) /
							node.linksOut.reduce((sum, n) => sum + n.value, 0);
						node.y = node.y + (y - center(node)) * alpha;
					});
				});

			function weightedTarget(link: SankeyLink) {
				return center(link.target) * link.value;
			}
		}

		function resolveCollisions() {
			nodesByBreadth.forEach((nodes) => {
				let node: SankeyNode = nodes[0];
				let dy: number;
				let y0: number = 0;
				let n = nodes.length;
				let i: number;

				// Push any overlapping nodes down.
				nodes.sort((a, b) => a.y - b.y);
				for (i = 0; i < n; ++i) {
					node = nodes[i];
					dy = y0 - node.y;
					if (dy > 0) node.y += dy;
					y0 = node.y + node.dy + NODE_PADDING;
				}

				// If the bottommost node goes outside the bounds, push it back up.
				dy = y0 - NODE_PADDING - height;
				if (dy <= 0) return;
				y0 = node.y -= dy;

				// Push any overlapping nodes back up.
				for (i = n - 2; i >= 0; --i) {
					node = nodes[i];
					dy = node.y + node.dy + NODE_PADDING - y0;
					if (dy > 0) node.y -= dy;
					y0 = node.y;
				}
			});
		}
	}

	function computeLinkDepths() {
		nodes.forEach((node) => {
			node.linksIn.sort((a, b) => a.source.y - b.source.y);
			node.linksOut.sort((a, b) => a.target.y - b.target.y);
		});

		nodes.forEach((node) => {
			let sy = 0;
			let ty = 0;
			node.linksOut.forEach((link) => {
				link.sy = sy;
				sy += link.dy ?? 0;
			});
			node.linksIn.forEach((link) => {
				link.ty = ty;
				ty += link.dy ?? 0;
			});
		});
	}

	onMount(handleSize);

	function handleSize() {
		if (!svg) return;
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
	}

	function linkPath(link: SankeyLinkRaw) {
		if (link.causesCycle) {
			// Draw links that cause cycles as loops
			const x0 = link.source.x + NODE_WIDTH;
			const x1 = link.target.x;
			const xsc = x0 * -0.25 + x1 * 1.25;
			const xtc = x0 * 1.25 + x1 * -0.25;
			const xm = (x0 + x1) * 0.5;
			const y0 = link.source.y + (link.sy ?? 0) + (link.dy ?? 0);
			const y1 = link.target.y + (link.ty ?? 0) + (link.dy ?? 0);
			const ym = y0 * -0.5 + y1 * 1.5;
			return (
				`M${x0},${y0}` + ` C${xsc},${y0} ${xsc},${ym} ${xm},${ym}` + ` S${xtc},${y1} ${x1},${y1}`
			);
		}

		const x0 = link.source.x + NODE_WIDTH;
		const x1 = link.target.x;
		const xi = (x0 + x1) / 2;
		const y0 = link.source.y + (link.sy ?? 0) + (link.dy ?? 0) / 2;
		const y1 = link.target.y + (link.ty ?? 0) + (link.dy ?? 0) / 2;
		return `M${x0},${y0} C${xi},${y0} ${xi},${y1} ${x1},${y1}`;
	}
</script>

<svelte:window on:resize={handleSize} />

<div>
	<svg {width} {height} viewBox={`-2 -2 ${width + 2} ${height + 2}`} bind:this={svg}>
		<g class="links">
			{#each rawLinks.toSorted((a, b) => b.value - a.value) as link}
				<path class="link" d={linkPath(link)} style:stroke-width={Math.max(1, link.dy)}>
					<title>{link.source.label} → {link.target.label} - {link.value}</title>
				</path>
			{/each}
		</g>
		<g class="nodes">
			{#each rawNodes as node}
				<rect
					class="node"
					x={node.x}
					y={node.y}
					width={NODE_WIDTH}
					height={node.dy}
					fill={node.color}
				>
					<title>{node.label} - {node.value}</title>
				</rect>
				<text
					x={node.x + NODE_WIDTH / 2}
					y={node.y + node.dy / 2}
					text-anchor="middle"
					alignment-baseline="middle">{node.label}</text
				>
			{/each}
		</g>
	</svg>
</div>

<style>
	svg {
		font: 9px sans-serif;
	}

	.link {
		fill: none;
		stroke: #000;
		stroke-opacity: 0.2;
	}

	.link:hover {
		stroke-opacity: 0.5;
	}

	.node {
		stroke: #000;
		stroke-width: 2px;
	}
</style>
