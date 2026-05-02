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
		moveable?: boolean;
	}
	let {
		x,
		y,
		yOffset = 0,
		isOnTop = true,
		children,
		minX,
		maxX,
		moveable = false
	}: Props = $props();

	let tooltipDiv = $state<HTMLDivElement>();

	// =============================
	// TRACKING TOOLTIP WIDTH
	// =============================

	let width = $state(200);

	$effect(() => {
		x;
		y;
		untrack(() => {
			if (!tooltipDiv) return;
			width = tooltipDiv.getBoundingClientRect().width;
		});
	});

	// =============================
	// DRAGGING LOGIC
	// =============================

	let dragOffsetX = $state(0);
	let dragOffsetY = $state(0);
	let dragging = $state(false);
	let startPointerX = 0;
	let startPointerY = 0;
	let startOffsetX = 0;
	let startOffsetY = 0;

	function onPointerDown(event: PointerEvent) {
		dragging = true;
		startPointerX = event.clientX;
		startPointerY = event.clientY;
		startOffsetX = dragOffsetX;
		startOffsetY = dragOffsetY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		dragOffsetX = startOffsetX + (event.clientX - startPointerX);
		dragOffsetY = startOffsetY + (event.clientY - startPointerY);
	}

	function onPointerUp(event: PointerEvent) {
		dragging = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	// =============================
	// COMPUTE FINAL POSITION
	// =============================

	let adjustedX = $derived.by(() => {
		let newX = x + dragOffsetX;
		if (minX !== undefined && newX < minX + width / 2) {
			newX = minX + width / 2;
		}
		if (maxX !== undefined && newX > maxX - width / 2) {
			newX = maxX - width / 2;
		}
		return newX;
	});

	let adjustedY = $derived.by(() => {
		return (isOnTop ? y - 5 - yOffset : y + 5 + yOffset) + dragOffsetY;
	});
</script>

<div transition:fade={{ duration: 300 }}>
	<div
		class={[
			!moveable && 'pointer-events-none',
			'absolute z-3 rounded bg-black py-2 pe-0 text-white opacity-75 dark:bg-white dark:text-black'
		]}
		style:left={`${adjustedX}px`}
		style:top={`${adjustedY}px`}
		style:transform={isOnTop ? `translate(-50%, -100%)` : `translate(-50%, 0%)`}
		style:min-width="200px"
		style:touch-action="none"
		style:user-select="none"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		bind:this={tooltipDiv}
		role="tooltip"
	>
		{@render children()}
	</div>

	{#if !moveable}
		<svg
			class="pointer-events-none absolute -translate-x-1/2 opacity-75"
			style:left={`${x + dragOffsetX}px`}
			style:top={`${adjustedY + (isOnTop ? 0 : -5)}px`}
			width="10"
			height="5"
		>
			{#if isOnTop}
				<polygon points="0,0 10,0 5,5" class="fill-black dark:fill-white" />
			{:else}
				<polygon points="0,5 10,5 5,0" class="fill-black dark:fill-white" />
			{/if}
		</svg>
	{/if}
</div>
