/**
 * Remove duplicates from an array
 * @param array array to be filtered
 * @returns filtered array
 */
export function removeDuplicates<T>(array: T[]): T[] {
	return Array.from(new Set(array));
}

/**
 * Converts an array of strings to an array of objects with value and label properties used for `Dropdown` options.
 * @param array array of strings to be converted to options
 * @returns
 */
export function toOptions(array: string[]): { value: string; label: string }[] {
	return array.map((item) => ({
		value: item,
		label: item
	}));
}

/**
 * Get transport edges based on the provided edges, selected nodes, and direction.
 * Selects edges that are either incoming or outgoing with respect to the selected nodes. Edges in between selected nodes are excluded.
 * @param edges A list of all edges in the system, where each edge is represented as a string in the format "node1,node2".
 * @param selectedNodes A list of nodes that should be considered for filtering the edges. The function will determine whether to include edges based on whether they connect to these nodes.
 * @param directionIn Whether to filter for incoming edges (true) or outgoing edges (false). If true, the function will include edges where the second node is in the selectedNodes and the first node is not. If false, it will include edges where the first node is in the selectedNodes and the second node is not.
 * @returns An array of edge identifiers that match the specified criteria based on the selected nodes and direction.
 */
export function getTransportEdges(
	edges: Record<string, string>,
	selectedNodes: string[],
	directionIn: boolean
): string[] {
	return Object.entries(edges)
		.filter(([, csvNodes]) => {
			const nodes = csvNodes.split(',');
			return (
				(directionIn && !selectedNodes.includes(nodes[0]) && selectedNodes.includes(nodes[1])) ||
				(!directionIn && selectedNodes.includes(nodes[0]) && !selectedNodes.includes(nodes[1]))
			);
		})
		.map(([edgeId]) => edgeId);
}

/**
 * Iterate over the keys of an object with a type assertion for the keys, allowing for better type inference in the callback function.
 * @param obj The object whose keys are to be iterated over.
 * @returns An array of keys from the object, typed as T.
 */
export function typedKeys<T extends string>(obj: Record<T, unknown>): T[] {
	return Object.keys(obj) as T[];
}

/**
 * Iterate over the entries of an object with a type assertion for the keys, allowing for better type inference in the callback function.
 * @param obj The object whose entries are to be iterated over.
 * @returns An array of key-value pairs from the object, with the keys typed as T.
 */
export function typedEntries<T extends string, V>(obj: Record<T, V>): [T, V][] {
	return Object.entries(obj) as [T, V][];
}
