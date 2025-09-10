<script lang="ts">
	import type { SankeyNode } from "$lib/types";
	import { onMount } from "svelte";

	let width = $state(936);
	let height = $state(800);

    let svg = $state<SVGSVGElement>();

	interface Props {
		nodes: SankeyNode[];
	}

	let { nodes }: Props = $props();

    onMount(handleSize);

	function handleSize() {
        if (!svg) return;
		const { width: w, height: h } = svg.parentElement!.getBoundingClientRect();
		width = w;
		height = h;
	}
</script>

<svelte:window on:resize={handleSize} />

<div>
    <svg width={width} height={height} bind:this={svg}>
        <rect width={width} height={height} fill="lightgray"></rect>
    </svg>
</div>
