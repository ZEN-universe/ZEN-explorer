<script lang="ts">
    export let elements: any[];

    let selected_elements: string[] = [];
    let all_select: boolean = false;
    // Values that are passed in as props
    // are immediately available

    function update_all() {
        if (all_select) {
            selected_elements = elements;
        } else {
            selected_elements = [];
        }
    }
    function update_all_checkbox() {
        if (selected_elements.length == elements.length) {
            all_select = true;
        } else {
            all_select = false;
        }
    }
</script>

<div class="form-check">
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
    <div class="form-check">
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
