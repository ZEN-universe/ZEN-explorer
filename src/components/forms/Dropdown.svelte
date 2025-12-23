<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import SlimSelect from './SlimSelect.svelte';

	interface Props {
		options: ({ label: string; value: string } | string)[];
		value: string | null;
		label: string;
		disabled?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onUpdate?: (value: any) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(),
		label,
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();
	const formId = $props.id();

	let options = $derived.by(() => {
		return initialOptions.map((option) => {
			if (typeof option === 'string') {
				return { text: option, value: option };
			} else {
				return { text: option.label, value: option.value };
			}
		});
	});
</script>

<FilterLabel {label} {formId}></FilterLabel>

{#if options.length == 0}
	<div class="text-gray-500 dark:text-gray-400 italic">No options available</div>
{:else}
	<SlimSelect id={formId} {label} bind:value {options} {disabled} {onUpdate}></SlimSelect>
{/if}
