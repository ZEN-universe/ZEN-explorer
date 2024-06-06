<script lang="ts">
    import { createEventDispatcher } from "svelte";
    export let options: any[];
    export let selected_option: any = options[0];
    export let enabled: boolean = true;
    let uniqueID = options.join("_");

    const dispatch = createEventDispatcher();

    function update_selection() {
        dispatch("selection-changed", selected_option);
    }
</script>

<div role="radiogroup" id={`group-${uniqueID}`}>
    {#each options as option, i}
        <div class="form-check">
            <input
                class="form-check-input"
                type="radio"
                id={"radio-" + option}
                bind:group={selected_option}
                on:change={update_selection}
                value={option}
                disabled={!enabled}
            />
            <label class="form-check-label" for={"radio-" + option}>
                {option}
            </label>
        </div>
    {/each}
</div>
