<script lang="ts">
	interface Props {
		elements: any[];
		selected_elements: any[];
		enabled?: boolean;
		selection_changed: (selected_elements: any[]) => void;
	}

	let {
		elements,
		selected_elements = $bindable(elements),
		enabled = true,
		selection_changed
	}: Props = $props();
	let id = $props.id();

	let all_selected: boolean = $derived(selected_elements.length == elements.length);

	function toggleAll() {
		if (all_selected) {
			selected_elements = [];
		} else {
			selected_elements = elements;
		}
        selection_changed(selected_elements);
	}

    function dispatchEvent() {
        selection_changed(selected_elements);
    }
</script>

<div class="form-group">
    <button
        class="btn btn-outline-primary btn-sm"
		style="min-width: 100px"
        onclick={toggleAll}
        id={`all_checkbox_${id}`}
        disabled={!enabled}
    >
        {#if all_selected}
            Deselect all
        {:else}
            Select all
        {/if}
    </button>
	{#each elements as element, i}
		<div class="form-check form-check-inline">
			<input
				class="form-check-input"
				type="checkbox"
				value={element}
				bind:group={selected_elements}
				id={`${element}_checkbox_${id}`}
				onchange={dispatchEvent}
				disabled={!enabled}
			/>
			<label class="form-check-label" for={`${element}_checkbox_${id}`}>
				{element}
			</label>
		</div>
	{/each}
</div>
