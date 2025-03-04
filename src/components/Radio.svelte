<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	interface Props {
		options: any[];
		selected_option?: any;
		enabled?: boolean;
		selection_changed: (selected_option: any) => void;
	}

	let { options, selected_option = $bindable(options[0]), enabled = true, selection_changed }: Props = $props();
	let uniqueID = options.join('_');

	function update_selection() {
		selection_changed(selected_option);
	}
</script>

<div role="radiogroup" id={`group-${uniqueID}`}>
	{#each options as option, i}
		<div class="form-check">
			<input
				class="form-check-input"
				type="radio"
				id={'radio-' + option}
				bind:group={selected_option}
				onchange={update_selection}
				value={option}
				disabled={!enabled}
			/>
			<label class="form-check-label" for={'radio-' + option}>
				{option}
			</label>
		</div>
	{/each}
</div>
