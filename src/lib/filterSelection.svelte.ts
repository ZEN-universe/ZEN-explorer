import { untrack } from "svelte";

export function updateSelectionOnStateChanges<T extends string | number>(
	getOptions: () => T[],
	hasLoadedRelevantData: () => boolean,
	getPrevious: () => string,
	getUrlParams: () => number[] | null,
	setSelected: (value: T[]) => void,
	setPrevious: (value: string) => void,
	setUrlParams: (value: number[] | null) => void,
	debug: boolean = false
) {
	$effect(() => {
		getOptions();
		untrack(() => {
			if (!hasLoadedRelevantData()) {
				if (debug) console.log('No selected solution, skipping');
				return;
			}
			if (debug) console.log('Options changed', $state.snapshot(getOptions()));
			
			const urlParams = getUrlParams();
			const options = getOptions();
			if (urlParams !== null) {
				if (options.length) {
					const selectedOptions = urlParams.map((i) => options[i]).filter((c) => c !== undefined);
					if (debug) console.log('Set selection from URL params', urlParams, selectedOptions, urlParams, options);
					setSelected(selectedOptions);
				}
				if (debug) console.log('Reset URL params', urlParams, hasLoadedRelevantData());
				setUrlParams(null);
			} else if (/*hasSelectedSolution() && */getPrevious() !== options.join(',')) {
				if (debug) console.log('Reset selection to all options', hasLoadedRelevantData(), getPrevious(), options.join(','));
				setSelected(options);
			}

			// if (hasSelectedSolution()) {
				setPrevious(options.join(','));
			// }
		});
	});
}
