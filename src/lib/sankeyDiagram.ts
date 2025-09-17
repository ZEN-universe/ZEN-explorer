import type { RawSankeyLink, RawSankeyNode, SankeyLink, SankeyNode } from './types.js';

// Source: https://gist.github.com/cfergus/3956043 and https://gist.github.com/soxofaan/bb6f91d57dc4b6afe91d

/** width of each node */
export const NODE_WIDTH = 120;
/** minimum vertical padding between nodes */
export const NODE_PADDING = 16;
/** max height of a node */
export const NODE_MAX_HEIGHT = 200;
/** horizontal distance between nodes */
export const NODE_DISTANCE_BETWEEN = 140;
/** number of layout iterations to compute node's vertical position */
export const NUM_DEPTH_LAYOUT_ITERATIONS = 32;
/** width of the cycle lane */
export const CYCLE_LANE_NARROW_WIDTH = 5;
/** horizontal distance from node to start of cycle lane */
export const CYCLE_DIST_FROM_NODE = 20;
/** vertical distance from forward paths to cycle lane */
export const CYCLE_LANE_DIST_FROM_FWD_PATHS = -10;
/** vertical buffer around cycle lane */
export const CYCLE_LANE_SMALL_WIDTH_BUFFER = 2;
/** horizontal distance of control points from vertical */
export const CYCLE_CONTROL_POINT_DIST = 16;

let nodes: SankeyNode[] = [];
let links: SankeyLink[] = [];

// ==========================
// Section: Utility functions
// ==========================

/**
 * Compute the sum of values in an array using a mapping function.
 * @param array The array to iterate over.
 * @param f The mapping function to apply to each element.
 * @returns The computed sum.
 */
function sum<T>(array: T[], f: (el: T) => number) {
	return array.reduce((sum, el) => sum + f(el), 0);
}

// ====================================
// Section: Abstract graph computations
// ====================================

/**
 * For each node, compute the incoming and outgoing links.
 */
function computeNodeLinks() {
	nodes.forEach((node) => {
		node.linksOut = links.filter((link) => link.source === node);
		node.linksIn = links.filter((link) => link.target === node);
	});
}

/**
 * Compute the value of each node as the maximum of incoming and outgoing link values.
 * Ideally, the incoming and outgoing link values should be equal,
 */
function computeNodeValues() {
	nodes.forEach((node) => {
		node.value = Math.max(
			sum(node.linksIn, (link) => link.value),
			sum(node.linksOut, (link) => link.value)
		);
	});
}

/**
 * Remove nodes that have no incoming or outgoing links.
 */
function filterEmptyNodes() {
	nodes = nodes.filter((node) => node.linksIn.length > 0 || node.linksOut.length > 0);
}

/**
 * Iterate over all links iteratively and check if adding them would create a cycle.
 * If so, mark them as causing a cycle.
 *
 * This naïve algorithm runs in O(n²), but works well enough for small graphs.
 */
function markCycles() {
	let nextCycleIndex = 0;
	let addedLinks = [] as SankeyLink[];
	links.forEach((link) => {
		if (createsCycle(link.source, link.target, addedLinks)) {
			link.causesCycle = true;
			link.cycleIndex = ++nextCycleIndex;
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
	let nextLinks = graph.filter((link) => link.source === currentNode);

	// base cases
	if (graph.length == 0 || nextLinks.length == 0) return false;

	// cycle check
	return nextLinks.some(
		(link) => link.target === initialNode || createsCycle(initialNode, link.target, graph)
	);
}

// =================================
// Section: Node layout computations
// =================================

/**
 * Compute the horizontal position (breadth) of each node.
 * Nodes are assigned to levels based on their distance from source nodes.
 * Finally, the breadths are scaled to fit within the available width.
 *
 * Assumes that the graph is a Directed Acyclic Graph (DAG) if links that cause cycles are not traversed.
 */
function computeNodeBreadths() {
	let remainingNodes = nodes;
	let nextNodes: SankeyNode[] = [];
	let currentBreadth = 0;

	// iterate over the graph breadth-first, assigning x positions to nodes
	// start with all nodes and iterate until there are no nodes left
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

	// iterate backwards to move sink nodes to the rightmost position
	remainingNodes = nodes;
	while (remainingNodes.length) {
		nextNodes = [];
		remainingNodes.forEach((node) => {
			if (node.linksOut.length > 0) {
				const outgoingXs = node.linksOut
					.filter((link) => !link.causesCycle)
					.map((link) => link.target.x);
				if (outgoingXs.length > 0) {
					node.x = Math.max(node.x, Math.min(...outgoingXs) - 1);
				}
			}
			node.linksIn.forEach((link) => {
				if (link.causesCycle) return;
				nextNodes.push(link.source);
			});
		});
		remainingNodes = nextNodes;
	}

	// scale the x positions to have the desired distance between nodes
	scaleNodeBreadths(NODE_DISTANCE_BETWEEN + NODE_WIDTH);
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
function computeDepths() {
	let nodesByBreadth = nodesGroupedByBreadth();

	initializeNodeDepth();
	resolveCollisions();
	computeLinkDepths();
	for (let alpha = 1, i = 0; i < NUM_DEPTH_LAYOUT_ITERATIONS; ++i, alpha *= 0.99) {
		relaxRightToLeft(alpha);
		resolveCollisions();
		computeLinkDepths();
		relaxLeftToRight(alpha);
		resolveCollisions();
		computeLinkDepths();
	}
	bringBackToTop();
	computeLinkDepths();

	/**
	 * Set the initial vertical position (depth) of each node.
	 */
	function initializeNodeDepth() {
		// ky is the scaling factor to fit nodes within the height
		// It is determined by the node with the largest value and the max node height
		const ky = Math.min(
			...nodes.map((node) => (node.value > 1e-6 ? NODE_MAX_HEIGHT / node.value : Infinity))
		);

		nodesByBreadth.forEach((nodes) => {
			let sum = 0;
			nodes.forEach((node) => {
				node.y = sum;
				node.dy = node.value * ky;
				sum += node.dy + NODE_PADDING;
			});
		});

		links.forEach((link) => {
			link.dy = link.value * ky;
		});
	}

	/**
	 * Relax the node positions from left to right.
	 * This is done by moving each node towards the weighted average of the centers of its incoming links' source nodes.
	 * @param alpha The cooling factor for the relaxation step.
	 */
	function relaxLeftToRight(alpha: number) {
		nodesByBreadth.forEach((nodes) => {
			nodes.forEach((node) => {
				if (node.linksIn.length == 0) return;
				const y =
					sum(node.linksIn, (link) => center(link.source) * link.value) /
					sum(node.linksIn, (link) => link.value);
				node.y += (y - center(node)) * alpha;
			});
		});
	}

	/**
	 * Relax the node positions from right to left.
	 * This is done by moving each node towards the weighted average of the centers of its outgoing links' target nodes.
	 * @param alpha The cooling factor for the relaxation step.
	 */
	function relaxRightToLeft(alpha: number) {
		nodesByBreadth
			.slice()
			.reverse()
			.forEach((nodes) => {
				nodes.forEach((node) => {
					if (node.linksOut.length == 0) return;
					const y =
						sum(node.linksOut, (link) => center(link.target) * link.value) /
						sum(node.linksOut, (link) => link.value);
					node.y += (y - center(node)) * alpha;
				});
			});
	}

	/**
	 * Resolve collisions between nodes at the same breadth (x position).
	 * Nodes are pushed down or up to ensure a minimum vertical padding between them.
	 */
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
		});
	}

	/**
	 * Bring all nodes back to the top of the diagram.
	 */
	function bringBackToTop() {
		let minY = Math.min(...nodes.map((node) => node.y));
		nodes.forEach((node) => {
			node.y -= minY;
		});
	}

	/**
	 * Compute the vertical offsets (sy, ty) of each link within their source and target nodes.
	 */
	function computeLinkDepths() {
		let compareFn = (property: 'source' | 'target') => (a: SankeyLink, b: SankeyLink) => {
			if (a.causesCycle && b.causesCycle) {
				return a.cycleIndex - b.cycleIndex; // both cause cycles, sort by cycle index
			} else if (a.causesCycle) {
				return -1; // a causes a cycle, b doesn't, so a comes first
			} else if (b.causesCycle) {
				return 1; // b causes a cycle, a doesn't, so b comes first
			}
			return a[property].y - b[property].y; // neither cause cycles, sort by target y position
		};

		nodes.forEach((node) => {
			node.linksIn.sort(compareFn('source'));
			node.linksOut.sort(compareFn('target'));
		});

		nodes.forEach((node) => {
			let sy = 0;
			let ty = 0;
			node.linksOut.forEach((link) => {
				link.sy = sy;
				sy += link.dy;
			});
			node.linksIn.forEach((link) => {
				link.ty = ty;
				ty += link.dy;
			});
		});
	}
}

// ============================
// Section: Interface functions
// ============================

/**
 * Update the layout of the Sankey diagram.
 * @param inputNodes The updated nodes of the diagram.
 * @param inputLinks The updated links of the diagram.
 */
export function updateSankeyLayout(inputNodes: SankeyNode[], inputLinks: SankeyLink[]) {
	nodes = inputNodes;
	links = inputLinks;

	computeNodeLinks();
	computeNodeValues();
	filterEmptyNodes();
	markCycles();
	computeNodeBreadths();
	computeDepths();
}

/**
 * Get the final nodes and links of the Sankey diagram.
 * @returns The final nodes and links with all properties initialized and positions computed by the layout algorithm.
 */
export function getFinalNodesAndLinks(): [RawSankeyNode[], RawSankeyLink[]] {
	const finalNodes = nodes.map((node) => ({
		label: node.label,
		color: node.color,
		value: node.value,
		x: node.x,
		y: node.y,
		dy: node.dy
	}));
	const finalLinks = links.map((link) => ({
		source: finalNodes[nodes.indexOf(link.source)],
		target: finalNodes[nodes.indexOf(link.target)],
		value: link.value,
		color: link.color,
		unit: link.unit,
		causesCycle: link.causesCycle,
		cycleIndex: link.cycleIndex,
		dy: link.dy,
		sy: link.sy,
		ty: link.ty
	}));
	return [finalNodes, finalLinks];
}
