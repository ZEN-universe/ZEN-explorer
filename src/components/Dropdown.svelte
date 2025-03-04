<script lang="ts">
	interface Props {
		options: any[];
		selected_option?: any;
		enabled?: boolean;
		selection_changed: (selected_option: any) => void;
	}

	let {
		options,
		selected_option = $bindable(options[0]),
		enabled = true,
		selection_changed
	}: Props = $props();

	function update_selection() {
		selection_changed(selected_option);
	}
</script>

<div class="dropdown">
	<select bind:value={selected_option} onchange={() => update_selection()} disabled={!enabled}>
		{#each options as option}
			<option value={option}>
				{option}
			</option>
		{/each}
	</select>
</div>
