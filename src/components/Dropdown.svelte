<script lang="ts">
	interface Props {
		label: string;
		options: any[];
		value?: any;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let {
		label,
		options,
		value = $bindable(options[0]),
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
			<option value={option}>
				{option}
			</option>
		{/each}
	</select>
</div>
