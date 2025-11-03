<script lang="ts">
	interface Props {
		formId: string;
		options: ({ value: string; label: string } | string)[];
		value?: any;
		disabled?: boolean;
		onUpdate?: (selected_option: any) => void;
	}

	let {
		formId,
		options: initialOptions,
		value = $bindable(),
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();

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
</script>

<div role="radiogroup">
	{#each options as option}
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				id={'radio-' + option.value}
				type="radio"
				bind:group={value}
				value={option.value}
				{disabled}
				onchange={updateSelection}
			/>
			<label class="form-check-label" for={'radio-' + option.value}>
				{option.label}
			</label>
		</div>
	{/each}
</div>
