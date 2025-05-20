<script lang="ts">
	interface Props {
		label: string;
		options: any[];
		value?: any;
		disabled?: boolean;
		onUpdate: (selected_option: any) => void;
	}

	let {
		label,
		options,
		value = $bindable(options[0]),
		disabled = false,
		onUpdate
	}: Props = $props();

	function updateSelection() {
		onUpdate(value);
	}
</script>

<h3>{label}</h3>
<div role="radiogroup">
	{#each options as option}
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				id={'radio-' + option}
				type="radio"
				bind:group={value}
				value={option}
				{disabled}
				onchange={updateSelection}
			/>
			<label class="form-check-label" for={'radio-' + option}>
				{option}
			</label>
		</div>
	{/each}
</div>
