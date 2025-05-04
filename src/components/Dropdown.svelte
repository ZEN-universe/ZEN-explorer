<script lang="ts">
	interface Props {
		options: { label: string; value: string }[];
		selected_option?: any;
		enabled?: boolean;
		selection_changed?: (selected_option: any) => void;
	}

	let {
		options,
		selected_option = $bindable(options.length > 0 ? options[0].value : undefined),
		enabled = true,
		selection_changed
	}: Props = $props();

	function update_selection() {
		selection_changed && selection_changed(selected_option);
	}
</script>

<div class="dropdown">
	<select
		class="form-select"
		bind:value={selected_option}
		onchange={() => update_selection()}
		disabled={!enabled}
	>
		{#each options as option}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>
</div>
