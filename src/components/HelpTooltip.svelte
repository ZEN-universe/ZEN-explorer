<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();

	let button = $state<HTMLButtonElement>();

	let isHovered = $state(false);
	let isFocused = $state(false);

	let buttonTop = $state(0);
	let buttonCenter = $state(0);

	function updateButtonPosition() {
		if (button) {
			const rect = button.getBoundingClientRect();
			buttonTop = rect.top;
			buttonCenter = rect.left + rect.width / 2;
		}
	}

    onMount(() => {
        updateButtonPosition();
    })
</script>

<button
	aria-label="Help tooltip"
	onmouseover={() => {isHovered = true}}
	onfocus={() => {isFocused = true, updateButtonPosition()}}
	onmouseleave={() => {isHovered = false}}
	onfocusout={() => {isFocused = false}}
	bind:this={button}
>
	<i
		class="bi bi-question-circle-fill text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
	></i>
</button>

{#if isHovered || isFocused}
	<div
		class="absolute font-normal -translate-x-1/2 -translate-y-full z-3 border bg-gray-200 dark:bg-gray-800 border-black dark:border-white rounded-lg p-2"
		style:top={`${buttonTop - 10}px`}
		style:left={`${buttonCenter}px`}
	>
		{content}
        <svg
			class="absolute -translate-x-1/2 left-1/2"
			style:bottom="-10px"
			width="20"
			height="10"
		>
			<polygon points="0,0 20,0 10,10" class="fill-gray-200 dark:fill-gray-800" />
            <path d="M0,0 L10,10 L20,0" class="fill-none stroke-black dark:stroke-white" />
		</svg>
	</div>
{/if}
