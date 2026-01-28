<script lang="ts">
	import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { onMount, type Snippet } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';

	interface Props {
		children: Snippet;
		maxWidth?: number;
	}
	type Side = 'top' | 'bottom';

	const PADDING_FROM_EDGE = 8;

	let { children, maxWidth = 500 }: Props = $props();

	let button = $state<HTMLButtonElement>();
	let tooltip = $state<HTMLDivElement>();
	let arrowElement = $state<SVGSVGElement>();

	let isHovered = $state(false);
	let isFocused = $state(false);

	let tooltipLeft: number | null = $state(null);
	let tooltipTop: number | null = $state(null);
	let tooltipMaxWidth = $derived(
		Math.min((innerWidth.current || maxWidth) - 2 * PADDING_FROM_EDGE, maxWidth)
	);
	let arrowLeft: number | null = $state(null);
	let arrowStaticSide: Side = $state('top');

	async function updateButtonPosition() {
		if (!button || !tooltip || !arrowElement) return;

		const { x, y, placement, middlewareData } = await computePosition(button, tooltip, {
			placement: 'top',
			middleware: [
				offset(8),
				flip(),
				shift({ padding: PADDING_FROM_EDGE }),
				arrow({ element: arrowElement })
			]
		});

		tooltipLeft = x;
		tooltipTop = y;

		arrowStaticSide = ({
			top: 'bottom',
			bottom: 'top'
		}[placement.split('-')[0]] ?? 'top') as Side;

		arrowLeft = middlewareData.arrow?.x ?? null;
	}

	onMount(() => {
		updateButtonPosition();
	});
</script>

<svelte:window onresize={updateButtonPosition} />

<button
	aria-label="Help tooltip"
	onclick={updateButtonPosition}
	onmouseover={() => {
		isHovered = true;
		updateButtonPosition();
	}}
	onfocus={() => {
		isFocused = true;
		updateButtonPosition();
	}}
	onmouseleave={() => {
		isHovered = false;
	}}
	onfocusout={() => {
		isFocused = false;
	}}
	bind:this={button}
>
	<i
		class="bi bi-question-circle-fill text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
	></i>
</button>

<div
	class="absolute z-3 w-[max-content] rounded-lg border border-black bg-gray-200 p-2 text-base font-normal dark:border-white dark:bg-gray-800"
	style:display={isHovered || isFocused ? 'block' : 'none'}
	style:top={tooltipTop !== null ? `${tooltipTop}px` : 0}
	style:left={tooltipLeft !== null ? `${tooltipLeft}px` : 0}
	style:max-width={`${tooltipMaxWidth}px`}
	bind:this={tooltip}
>
	{@render children()}
	<svg
		class="absolute z-3"
		style:left={arrowLeft !== null ? `${arrowLeft}px` : undefined}
		style={`${arrowStaticSide}: -10px`}
		width="20"
		height="10"
		bind:this={arrowElement}
	>
		{#if arrowStaticSide === 'bottom'}
			<polygon points="0,0 20,0 10,10" class="fill-gray-200 dark:fill-gray-800" />
			<path d="M0,0 L10,10 L20,0" class="fill-none stroke-black dark:stroke-white" />
		{:else}
			<polygon points="0,10 20,10 10,0" class="fill-gray-200 dark:fill-gray-800" />
			<path d="M0,10 L10,0 L20,10" class="fill-none stroke-black dark:stroke-white" />
		{/if}
	</svg>
</div>
