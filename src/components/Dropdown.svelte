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

<div class="dropdown">
    <select
        bind:value={selected_option}
        on:change={() => update_selection()}
        disabled={!enabled}
    >
        {#each options as option}
            <option value={option}>
                {option}
            </option>
        {/each}
    </select>
</div>
