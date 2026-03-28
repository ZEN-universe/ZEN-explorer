<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import {
		decodeValueFromURL,
		encodeValueForURL,
		getURLParam,
		updateURLParam
	} from '@/lib/queryParams.svelte';
	import Select from './Select.svelte';
	import { onMount, tick, untrack } from 'svelte';

	interface Props {
		label: string;
		options: string[];
		value: string[];
		emptyText?: string;
		disabled?: boolean;
		urlParam?: string;
		resetIfInvalid?: boolean;
		default?: string[] | null;
		onUpdate?: (value: string[]) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(initialOptions),
		label,
		emptyText = 'No options available.',
		disabled = false,
		urlParam,
		resetIfInvalid = false,
		onUpdate = () => {}
	}: Props = $props();
	const formId = $props.id();

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { text: option, value: option };
			} else {
				return option;
			}
		});
	});

	let areAllSelected: boolean = $derived(value.length == options.length);

	function toggleAll() {
		if (areAllSelected) {
			value = [];
		} else {
			value = options.map((o) => o.value);
		}
		onUpdate(value);
	}

	// Load URL parameters
	let urlParams: string[] | null = null;
	onMount(() => {
		if (urlParam === undefined) return;
		urlParams =
			decodeValueFromURL(getURLParam(urlParam) ?? '', options.length)
				?.map((index) => options[index]?.value)
				.filter((v) => v !== undefined) ?? null;
	});

	// Simple serialization of all options that is easy to compare by value
	function serializeOptions() {
		return options.map((o) => o.value).join(',');
	}

	// Update URL param when value changes
	$effect(() => {
		if (urlParam === undefined) return;
		value;
		tick().then(() =>
			updateURLParam(
				urlParam,
				encodeValueForURL(
					value.map((val) => options.findIndex((o) => o.value === val)),
					options.length
				)
			)
		);
	});

	// Reset value if options change and the current value is no longer valid
	let previousOptions: string | null = null;
	$effect(() => {
		options;
		untrack(() => {
			if (!resetIfInvalid) return;

			if (urlParams !== null) {
				// First check if we've already used our URL params.
				value = urlParams;
				onUpdate(value);
				urlParams = null; // only use URL param on first load
			} else if (previousOptions !== serializeOptions()) {
				// Then check if options have changed to prevent resetting the value on every render.
				console.log(`Resetting ${label} MultiSelect because options changed`);
				value = options.map((o) => o.value);
				onUpdate(value);
			}

			// Store current selection to distinguish between option changes and other re-renders
			previousOptions = serializeOptions();
		});
	});
</script>

<FilterLabel {label} {formId}>
	{#snippet rightSide()}
		{#if options.length > 0}
			<button class="ml-auto block text-blue-500" onclick={toggleAll} {disabled}>
				{#if areAllSelected}
					<i class="bi bi-x"></i>
				{:else}
					<i class="bi bi-check2-all"></i>
				{/if}
				{areAllSelected ? 'Deselect all' : 'Select all'}
			</button>
		{/if}
	{/snippet}
</FilterLabel>

{#if options.length == 0}
	<div class="mb-2 text-sm text-gray-500 italic">{emptyText}</div>
{:else}
	<Select id={formId} {label} bind:value {options} {disabled} multiple {onUpdate}></Select>
{/if}
