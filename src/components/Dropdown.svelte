<script lang="ts">
	interface Props {
		formId: string;
		options: { label: string; value: string }[];
		value: string | null;
		disabled?: boolean;
		onUpdate?: (value: any) => void;
	}

	let { formId, options, value = $bindable(), disabled = false, onUpdate }: Props = $props();

	function update_selection(event: Event) {
		onUpdate?.(value);
	}
</script>

<select id={formId} class="form-select" bind:value onchange={update_selection} {disabled}>
	{#each options as option}
		<option value={option.value}>
			{option.label}
		</option>
	{/each}
</select>
