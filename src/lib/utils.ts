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
