import type { RawSankeyLink, RawSankeyNode, SankeyLink, SankeyNode } from './types.js';

// Source: https://gist.github.com/cfergus/3956043 and https://gist.github.com/soxofaan/bb6f91d57dc4b6afe91d

/** width of each node */
export const NODE_WIDTH = 140;
/** minimum vertical padding between nodes */
export const NODE_PADDING = 16;
/** vertical padding between fixed nodes */
export const NODE_PADDING_FIXED_NODES = 50;
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
export const CYCLE_LANE_DIST_FROM_FWD_PATHS = 10;
/** vertical buffer around cycle lane */
export const CYCLE_LANE_SMALL_WIDTH_BUFFER = 2;
/** horizontal distance of control points from vertical */
export const CYCLE_CONTROL_POINT_DIST = 16;
/** Node's max height used for structure-only mode */
export const NODE_MAX_HEIGHT_STRUCTURE_ONLY = 40;
/** Link height used for structure-only mode */
export const LINK_HEIGHT_STRUCTURE_ONLY = 6;

let nodes: SankeyNode[] = [];
let links: SankeyLink[] = [];
let showStructureOnly: boolean = false;

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
		node.value = showStructureOnly
			? 1
			: Math.max(
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

	// iterate backwards to move sink nodes with {stickTo: null} to the rightmost position
	remainingNodes = nodes;
	while (remainingNodes.length) {
		nextNodes = [];
		remainingNodes.forEach((node) => {
			if (node.linksOut.length > 0 && node.stickTo === null) {
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

	// move all {stickTo: 'right'} nodes to the rightmost position
	nodes.forEach((node) => {
		if (node.stickTo === 'right') {
			node.x = currentBreadth - 1;
		}
	});

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
function computeNodeDepths() {
	let nodesByBreadth = nodesGroupedByBreadth();

	initializeNodeDepth();
	resolveCollisions();
	for (let alpha = 1, i = 0; i < NUM_DEPTH_LAYOUT_ITERATIONS; ++i, alpha *= 0.95) {
		relaxRightToLeft(alpha);
		resolveCollisions();
		relaxLeftToRight(alpha);
		resolveCollisions();
	}

	/**
	 * Set the initial vertical position (depth) of each node.
	 */
	function initializeNodeDepth() {
		// ky is the scaling factor to fit nodes within the height
		// It is determined by the node with the largest value and the max node height
		const maxHeight = showStructureOnly ? NODE_MAX_HEIGHT_STRUCTURE_ONLY : NODE_MAX_HEIGHT;
		const ky = Math.min(
			...nodes.map((node) => (node.value > 1e-6 ? maxHeight / node.value : Infinity))
		);

		let sum = 0;
		nodes
			.filter((node) => node.distinctRow)
			.sort((a, b) => a.x - b.x)
			.forEach((node) => {
				node.y = sum;
				node.dy = node.value * ky;
				sum += node.dy + NODE_PADDING_FIXED_NODES;
			});

		nodesByBreadth.forEach((nodes) => {
			let sum = 0;
			nodes
				.filter((node) => !node.distinctRow)
				.forEach((node) => {
					node.y = sum;
					node.dy = node.value * ky;
					sum += node.dy + NODE_PADDING;
				});
		});

		links.forEach((link) => {
			link.dy = showStructureOnly ? 6 : link.value * ky;
		});
	}

	/**
	 * Accessor to get the value of a link, considering structure-only mode and link value.
	 * @param link The link whose value is to be retrieved.
	 * @returns The value of the link.
	 */
	function getLinkValue(link: SankeyLink) {
		if (showStructureOnly) {
			return 1;
		} else {
			return Math.max(link.value, 1e-6);
		}
	}

	/**
	 * Relax the node positions from left to right.
	 * This is done by moving each node towards the weighted average of the centers of its incoming links' source nodes.
	 * @param alpha The cooling factor for the relaxation step.
	 */
	function relaxLeftToRight(alpha: number) {
		nodesByBreadth.forEach((nodes) => {
			nodes.forEach((node) => {
				if (node.linksIn.length === 0 || node.distinctRow) return;
				const links = node.linksIn;
				const y =
					sum(links, (link) => center(link.source) * getLinkValue(link)) /
					sum(links, (link) => getLinkValue(link));
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
					if (node.linksOut.length === 0 || node.distinctRow) return;
					const links = node.linksOut;
					const y =
						sum(links, (link) => center(link.target) * getLinkValue(link)) /
						sum(links, (link) => getLinkValue(link));
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
				if (node.distinctRow) {
					if (dy > 0) {
						nodes[i - 1].y = node.y + node.dy + NODE_PADDING;
						y0 = nodes[i - 1].y + nodes[i - 1].dy + NODE_PADDING;
					} else {
						y0 = node.y + node.dy + NODE_PADDING;
					}
				} else {
					if (dy > 0) {
						node.y += dy;
					}
					y0 = node.y + node.dy + NODE_PADDING;
				}
			}
		});
	}
}

/**
 * Compute the vertical offsets (sy, ty) of each link within their source and target nodes.
 */
function computeLinkDepths() {
	let compareFn =
		(property: 'source' | 'target', isOnTop: boolean) => (a: SankeyLink, b: SankeyLink) => {
			const onTopFactor = isOnTop ? 1 : -1;
			if (a.causesCycle && b.causesCycle) {
				return onTopFactor * (a.cycleIndex - b.cycleIndex); // both cause cycles, sort by cycle index
			} else if (a.causesCycle) {
				return -onTopFactor; // a causes a cycle, b doesn't, so a comes first
			} else if (b.causesCycle) {
				return onTopFactor; // b causes a cycle, a doesn't, so b comes first
			}
			return a[property].y - b[property].y; // neither cause cycles, sort by target y position
		};

	let maxHeight = Math.max(...nodes.map((node) => node.y + node.dy));
	nodes.forEach((node) => {
		node.linksIn.sort(compareFn('source', node.y < maxHeight / 2));
		node.linksOut.sort(compareFn('target', node.y < maxHeight / 2));
	});

	nodes.forEach((node) => {
		let sy = 0;
		let ty = 0;
		node.linksOut.forEach((link) => {
			if (showStructureOnly) {
				link.sy = (node.dy - link.dy) / 2;
			} else {
				link.sy = sy;
				sy += link.dy;
			}
		});
		node.linksIn.forEach((link) => {
			if (showStructureOnly) {
				link.ty = (node.dy - link.dy) / 2;
			} else {
				link.ty = ty;
				ty += link.dy;
			}
		});
	});
}

// ============================
// Section: Interface functions
// ============================

/**
 * Update the layout of the Sankey diagram.
 * @param inputNodes The updated nodes of the diagram.
 * @param inputLinks The updated links of the diagram.
 */
export function updateSankeyLayout(
	inputNodes: SankeyNode[],
	inputLinks: SankeyLink[],
	inputShowStructureOnly: boolean
) {
	nodes = inputNodes;
	links = inputLinks;
	showStructureOnly = inputShowStructureOnly;

	computeNodeLinks();
	computeNodeValues();
	filterEmptyNodes();
	markCycles();
	computeNodeBreadths();
	computeNodeDepths();
	computeLinkDepths();
}

/**
 * Update the vertical position of a node in the Sankey diagram.
 * @param node_idx The index of the node to update.
 * @param new_y The new y coordinate of the node.
 */
export function updateNodePosition(node_idx: number, new_y: number) {
	if (node_idx < 0 || node_idx >= nodes.length) return;
	nodes[node_idx].y = new_y;
	computeLinkDepths();
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
		unit: node.unit,
		unitSuffix: node.unitSuffix,
		showTotal: node.showTotal,
		x: node.x,
		y: node.y,
		dy: node.dy,
		linksIn: links.map((link, i) => (link.target === node ? i : -1)).filter((i) => i >= 0),
		linksOut: links.map((link, i) => (link.source === node ? i : -1)).filter((i) => i >= 0)
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
