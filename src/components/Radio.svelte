<script lang="ts">
	interface Props {
		formId: string;
		options: { value: string; label: string }[];
		value?: any;
		disabled?: boolean;
		onUpdate?: (selected_option: any) => void;
	}

	let {
		formId,
		options,
		value = $bindable(options[0]),
		disabled = false,
		onUpdate = () => {}
	}: Props = $props();

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
