<script lang="ts">
	import { fade } from 'svelte/transition';
	import { computePosition, flip, shift, offset, type VirtualElement } from '@floating-ui/dom';

	export interface ContextMenuItem {
		label: string;
		href: string;
	}

	interface Props {
		x: number;
		y: number;
		items: ContextMenuItem[];
	}

	let { x: clientX, y: clientY, items }: Props = $props();

	let x: number = $state(0);
	let y: number = $state(0);
	let contextMenuEl = $state<HTMLDivElement>();

	async function updateButtonPosition() {
		if (!contextMenuEl) return;

		const { x: newX, y: newY } = await computePosition(
			{
				getBoundingClientRect: () => ({
					width: 0,
					height: 0,
					x: clientX,
					y: clientY,
					top: clientY,
					left: clientX,
					right: clientX,
					bottom: clientY
				})
			} as VirtualElement,
			contextMenuEl,
			{
				placement: 'top',
				middleware: [offset(4), flip(), shift({ padding: 8 })]
			}
		);
		x = newX;
		y = newY;
	}

	// onMount(() => {updateButtonPosition()});
	$effect(() => {
		clientX;
		clientY;
		updateButtonPosition();
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div
	class="absolute z-6 flex flex-col rounded border border-gray-400 bg-gray-200 text-nowrap shadow-xl/20 dark:border-gray-700 dark:bg-gray-800 dark:bg-gray-900"
	style:top={`${y}px`}
	style:left={`${x}px`}
	transition:fade={{ duration: 100 }}
	bind:this={contextMenuEl}
>
	{#each items as item, i (i)}
		<a
			href={item.href}
			class={[
				'p-2 hover:bg-gray-300 dark:hover:bg-gray-800',
				i > 0 && 'border-t border-gray-400 dark:border-gray-700',
				i === 0 && 'rounded-t',
				i === items.length - 1 && 'rounded-b'
			]}
		>
			{item.label}
		</a>
	{/each}
</div>
