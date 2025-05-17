<script lang="ts">
	interface Props {
		label: string;
		options: { label: string; value: string }[];
		value?: any;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let {
		label,
		options,
		value = $bindable(options.length > 0 ? options[0].value : undefined),
		disabled = false,
		onUpdate
	}: Props = $props();

	function update_selection() {
		onUpdate?.(value);
	}
</script>

<h3>{label}</h3>
<div class="dropdown">
	<select class="form-select" bind:value onchange={() => update_selection()} {disabled}>
		{#each options as option}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>
</div>
