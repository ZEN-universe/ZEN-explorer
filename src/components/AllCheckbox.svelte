<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		elements: any[];
		selected_elements: any[];
		enabled?: boolean;
		selection_changed: (selected_elements: any[]) => void;
	}

	let {
		elements,
		selected_elements,
		enabled = true,
		selection_changed
	}: Props = $props();
	let id = $props.id();

	let all_selected: boolean = $derived(selected_elements.length == elements.length);

	function toggle_all() {
		if (all_selected) {
			selected_elements = elements;
		} else {
			selected_elements = [];
		}
        selection_changed(selected_elements);
	}

    function on_change() {
        selection_changed(selected_elements);
    }

	onMount(() => {
		selected_elements = elements;
	});

    $effect(() => {
        selected_elements = elements;
    });
</script>

<form>
    <button
        class="btn btn-outline-primary btn-sm"
        onclick={toggle_all}
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
				onchange={on_change}
				disabled={!enabled}
			/>
			<label class="form-check-label" for={`${element}_checkbox_${id}`}>
				{element}
			</label>
		</div>
	{/each}
</form>
