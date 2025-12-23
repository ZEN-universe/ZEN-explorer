/**
 * Debounce a function call by the given wait time in milliseconds.
 * @param func Function to debounce.
 * @param wait Time in milliseconds to wait before invoking the function.
 * @returns Debounced function.
 *
 * @example
 * // Register a debounced function
 * const debouncedFunction = debounce(() => {
 *     console.log('Function called after 300ms of inactivity');
 * }, 300);
 *
 * // Call the debounced function multiple times
 * debouncedFunction();
 * debouncedFunction();
 * debouncedFunction();
 * // The actual function will be called only once, 300ms after the last call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends any[]>(
	func: (...args: T) => void,
	wait: number
): (...args: T) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return function (...args: T) {
		// Restart timer on each call
		clearTimeout(timeout);
		// Wait `wait` milliseconds before invoking the function
		timeout = setTimeout(() => func(...args), wait);
	};
}
