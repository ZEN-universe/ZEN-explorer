<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";

    export let value: boolean;
    export let texts: string[] = ["on", "off"];
    let id = "";

    onMount(() => {
        id = Math.random().toString(16).slice(2);
    });

    const dispatch = createEventDispatcher();
</script>

<div class="toggle">
    <input
        type="checkbox"
        class="btn-check"
        id={"btn-check-outlined" + id}
        bind:checked={value}
        on:change={() => {
            dispatch("change");
        }}
    />
    <label class="btn btn-outline-primary btn-sm" for={"btn-check-outlined" + id}
        >{value ? texts[0] : texts[1]}</label
    >
</div>
