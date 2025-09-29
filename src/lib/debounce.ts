/**
 * Debounce a function call by the given wait time in milliseconds.
 * @param func
 * @param wait
 */
export function debounce<T extends any[]>(
	func: (...args: T) => void,
	wait: number
): (...args: T) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return function (...args: T) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
