<script lang="ts">
	import FilterLabel from '$components/FilterLabel.svelte';
	import SlimSelect from './SlimSelect.svelte';

	interface Props {
		label: string;
		options: string[];
		value: string[];
		emptyText?: string;
		disabled?: boolean;
		onUpdate?: (value: string[]) => void;
	}

	let {
		options: initialOptions,
		value = $bindable(initialOptions),
		label,
		emptyText = 'No options available.',
		disabled = false,
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
</script>

<FilterLabel {label} {formId}>
	{#snippet rightSide()}
		<button class="text-blue-500 block ml-auto" onclick={toggleAll} {disabled}>
			{#if areAllSelected}
				<i class="bi bi-x"></i>
			{:else}
				<i class="bi bi-check2-all"></i>
			{/if}
			{areAllSelected ? 'Deselect all' : 'Select all'}
		</button>
	{/snippet}
</FilterLabel>

{#if options.length == 0}
	<div class="text-gray-500 italic text-sm mb-2">{emptyText}</div>
{:else}
	<SlimSelect id={formId} {label} bind:value {options} {disabled} multiple {onUpdate}></SlimSelect>
{/if}
