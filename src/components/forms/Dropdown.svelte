<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import { onMount, tick, type Snippet } from 'svelte';
	import Select from './Select.svelte';
	import { getURLParam, updateURLParam } from '@/lib/queryParams.svelte';

	interface Props {
		options: ({ label: string; value: string } | string)[];
		value: string | null;
		label: string;
		helpText?: Snippet;
		disabled?: boolean;
		urlParam?: string;
		unsetIfInvalid?: boolean;
		default?: string | null;
		onUpdate?: (value: string | null) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(),
		label,
		helpText,
		disabled = false,
		urlParam,
		unsetIfInvalid = false,
		default: defaultValue = null,
		onUpdate = () => {}
	}: Props = $props();
	const formId = $props.id();

	// Transform options to uniform format
	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { text: option, value: option };
			} else {
				return { text: option.label, value: option.value };
			}
		});
	});

	// Ensure value is null if it's not in options
	$effect(() => {
		if (!unsetIfInvalid) return;
		if (!options.some((opt) => opt.value === value)) {
			value = defaultValue;
			onUpdate(defaultValue);
		}
	});

	// Initialize value from URL param on mount
	onMount(() => {
		if (urlParam === undefined) return;
		value = getURLParam(urlParam) ?? value;
	});

	// Update URL param when value changes
	$effect(() => {
		if (urlParam === undefined) return;
		value;
		tick().then(() => updateURLParam(urlParam, value));
	});
</script>

<FilterLabel {label} {formId} {helpText}></FilterLabel>

{#if options.length == 0}
	<div class="text-gray-500 italic dark:text-gray-400">No options available</div>
{:else}
	<Select id={formId} {label} bind:value {options} {disabled} {onUpdate}></Select>
{/if}
