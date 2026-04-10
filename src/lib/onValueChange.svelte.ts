import { untrack } from 'svelte';

/**
 * Utility function to run a callback whenever the value returned by `getValue` changes.
 * The type parameter `T` must support strict equality comparison, e.g., primitive types.
 * @param getValue A function that returns the value to watch for changes.
 * @param callback A function to call whenever the value changes.
 *
 * @example
 * ```ts
 * const carrier: string | null = $state(null);
 * onValueChange(() => carrier, fetchData);
 * ```
 */
export function onValueChange<T>(getValue: () => T, callback: () => void): void {
	let previous: T = untrack(getValue);

	$effect(() => {
		getValue();
		untrack(() => {
			const current = getValue();
			if (current === previous) return;
			previous = current;
			callback();
		});
	});
}
