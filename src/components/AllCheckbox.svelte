<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    export let elements: any[];
    export let selected_elements: any[];

    const dispatch = createEventDispatcher();

    let all_select: boolean = false;
    // Values that are passed in as props
    // are immediately available

    function update_all() {
        if (all_select) {
            selected_elements = elements;
        } else {
            selected_elements = [];
        }

        update_all_checkbox();
    }
    function update_all_checkbox() {
        all_select = selected_elements.length == elements.length;
        dispatch("selection-changed", selected_elements);
    }

    onMount(() => {
        update_all_checkbox();
    });

    $: () => {
        update_all_checkbox();
    };
</script>

<div class="form-check form-check-inline">
    <input
        class="form-check-input"
        type="checkbox"
        bind:checked={all_select}
        on:change={update_all}
        id="all_checkbox"
    />
    <label class="form-check-label" for="all_checkbox"> Select all </label>
</div>
{#each elements as element, i}
    <div class="form-check form-check-inline">
        <input
            class="form-check-input"
            type="checkbox"
            value={element}
            bind:group={selected_elements}
            id={element + "_checkbox"}
            on:change={update_all_checkbox}
        />
        <label class="form-check-label" for={element + "_checkbox"}>
            {element}
        </label>
    </div>
{/each}
