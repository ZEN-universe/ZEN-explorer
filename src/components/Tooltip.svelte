<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		x: number;
		y: number;
		yOffset?: number;
		isOnTop?: boolean;
		content: Snippet<[]>;
	}
	let { x, y, yOffset = 0, isOnTop = true, content }: Props = $props();
</script>

<div
	class="position-absolute bg-black bg-opacity-75 text-white py-2 rounded pe-none z-3"
	style:top={isOnTop ? `${y - 5 - yOffset}px` : `${y + 5 + yOffset}px`}
	style:left={`${x}px`}
	style:transform={isOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
	style:min-width="200px"
	transition:fade={{ duration: 300 }}
>
	{#if isOnTop}
		<svg
			class="position-absolute translate-middle-x opacity-75 start-50"
			style:bottom="-5px"
			width="10"
			height="5"
		>
			<polygon points="0,0 10,0 5,5" fill="black" />
		</svg>
	{:else}
		<svg
			class="position-absolute translate-middle-x opacity-75 start-50"
			style:top="-5px"
			width="10"
			height="5"
		>
			<polygon points="0,5 10,5 5,0" fill="black" />
		</svg>
	{/if}
	{@render content()}
</div>
