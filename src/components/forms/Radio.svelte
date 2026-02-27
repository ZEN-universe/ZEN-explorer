<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import { getURLParam, updateURLParam } from '@/lib/queryParams.svelte';
	import { onMount, tick, type Snippet } from 'svelte';

	interface Props {
		options: ({ value: string; label: string } | string)[];
		value: string;
		label: string;
		helpText?: Snippet;
		disabled?: boolean;
		urlParam?: string;
		default?: string;
		unsetIfInvalid?: boolean;
		onUpdate?: (newValue: string) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(),
		label,
		helpText,
		disabled = false,
		urlParam,
		default: defaultValue,
		unsetIfInvalid = false,
		onUpdate = () => {}
	}: Props = $props();
	const labelId = $props.id();

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { label: option, value: option };
			} else {
				return option;
			}
		});
	});

	function updateSelection() {
		onUpdate(value);
	}

	$effect(() => {
		if (!unsetIfInvalid) return;
		if (!options.some((option) => option.value === value)) {
			value = defaultValue ?? (options[0]?.value || '');
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

<FilterLabel {labelId} {label} {helpText}></FilterLabel>

<div class="mb-2 flex gap-2" role="radiogroup" aria-labelledby={labelId}>
	{#each options as option (option.value)}
		<div class="relative">
			<input
				class="absolute inset-y-0 w-4 appearance-none"
				id={'radio-' + option.value}
				type="radio"
				bind:group={value}
				value={option.value}
				{disabled}
				onchange={updateSelection}
			/>
			<label class="flex items-center" for={'radio-' + option.value}>
				<div
					class={[
						'me-2 flex h-4 w-4 items-center justify-center rounded-full border-2',
						!disabled && value === option.value
							? 'border-blue-500'
							: 'border-gray-400 dark:border-gray-600'
					]}
				>
					{#if value === option.value}
						<div class="h-2 w-2 rounded-full bg-blue-500"></div>
					{/if}
				</div>
				{option.label}
			</label>
		</div>
	{/each}
</div>
