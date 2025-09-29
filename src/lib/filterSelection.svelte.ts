import { untrack } from 'svelte';

/**
 * A utility function to update the selection of options based on state changes.
 * It reacts to changes in the available options. It so, it takes into account possible URL
 * parameters and previous selections to determine the new selection.
 *
 * @template T - The type of the options, which can be either string or number.
 * @param getOptions Getter function to retrieve the current list of options.
 * @param hasLoadedRelevantData Function to check if the relevant data has been loaded.
 * @param getPrevious Getter function to retrieve a hash of the previous selection.
 * @param getUrlParams Getter function to retrieve the current URL parameters.
 * @param setSelected Setter function to update the selected options.
 * @param setPrevious Setter function to update the hash for the previous selection.
 * @param setUrlParams Setter function to update the URL parameters.
 */
export function updateSelectionOnStateChanges<T extends string | number>(
	getOptions: () => T[],
	hasLoadedRelevantData: () => boolean,
	getPrevious: () => string,
	getUrlParams: () => number[] | null,
	setSelected: (value: T[]) => void,
	setPrevious: (value: string) => void,
	setUrlParams: (value: number[] | null) => void
) {
	$effect(() => {
		getOptions();
		untrack(() => {
			if (!hasLoadedRelevantData()) return;

			const urlParams = getUrlParams();
			const options = getOptions();
			if (urlParams !== null) {
				if (options.length) {
					const selectedOptions = urlParams.map((i) => options[i]).filter((c) => c !== undefined);
					setSelected(selectedOptions);
				}
				setUrlParams(null);
			} else if (getPrevious() !== options.join(',')) {
				setSelected(options);
			}

			setPrevious(options.join(','));
		});
	});
}
