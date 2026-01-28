<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		x: number;
		y: number;
		yOffset?: number;
		isOnTop?: boolean;
		children: Snippet<[]>;
		minX?: number;
		maxX?: number;
	}
	let { x, y, yOffset = 0, isOnTop = true, children, minX, maxX }: Props = $props();

	let tooltipDiv = $state<HTMLDivElement>();

	let width = $state(200);

	$effect(() => {
		x;
		y;
		untrack(() => {
			if (!tooltipDiv) return;
			width = tooltipDiv.getBoundingClientRect().width;
		});
	});

	let adjustedX = $derived.by(() => {
		let newX = x;
		if (minX !== undefined && newX < minX + width / 2) {
			newX = minX + width / 2;
		}
		if (maxX !== undefined && newX > maxX - width / 2) {
			newX = maxX - width / 2;
		}
		return newX;
	});

	let adjustedY = $derived.by(() => {
		return isOnTop ? y - 5 - yOffset : y + 5 + yOffset;
	});
</script>

<div
	class="pointer-events-none absolute z-3 rounded bg-black py-2 pe-0 text-white opacity-75 dark:bg-white dark:text-black"
	style:left={`${adjustedX}px`}
	style:top={`${adjustedY}px`}
	style:transform={isOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
	style:min-width="200px"
	transition:fade={{ duration: 300 }}
	bind:this={tooltipDiv}
>
	{@render children()}
</div>

<svg
	class="translate-middle-x pointer-events-none absolute opacity-75"
	style:left={`${x}px`}
	style:top={`${adjustedY + (isOnTop ? 0 : -5)}px`}
	width="10"
	height="5"
	transition:fade={{ duration: 300 }}
>
	{#if isOnTop}
		<polygon points="0,0 10,0 5,5" class="fill-black dark:fill-white" />
	{:else}
		<polygon points="0,5 10,5 5,0" class="fill-black dark:fill-white" />
	{/if}
</svg>
