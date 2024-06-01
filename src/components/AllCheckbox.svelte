<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";
    export let elements: any[];
    export let selected_elements: any[];

    const dispatch = createEventDispatcher();
    let id = "";

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
        id = Math.random().toString(16).slice(2);
        update_all_checkbox();
    });

    $: () => {
        update_all_checkbox();
    };
</script>

<form>
    <div class="form-check form-check-inline">
        <input
            class="form-check-input"
            type="checkbox"
            bind:checked={all_select}
            on:click={update_all}
            id={"all_checkbox" + id}
        />
        <label class="form-check-label" for={"all_checkbox" + id}>
            Select all
        </label>
    </div>
    {#each elements as element, i}
        <div class="form-check form-check-inline">
            <input
                class="form-check-input"
                type="checkbox"
                value={element}
                bind:group={selected_elements}
                id={element + "_checkbox" + id}
                on:click={update_all_checkbox}
            />
            <label class="form-check-label" for={element + "_checkbox"}>
                {element}
            </label>
        </div>
    {/each}
</form>
