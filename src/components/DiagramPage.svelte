<script lang="ts">
	import type { Snippet } from 'svelte';
	import ContentBox from './ContentBox.svelte';

	interface Props {
		parentTitle?: string;
		pageTitle: string;
		subtitle?: string;
		filters: Snippet;
		buttons?: Snippet;
		mainContent: Snippet;
	}
	let { parentTitle, pageTitle, subtitle, filters, buttons, mainContent }: Props = $props();

	let sidebarCollapsed: boolean = $state(false);

	function toggleSidebarCollapse() {
		sidebarCollapsed = !sidebarCollapsed;
	}
</script>

<div class={['grid grid-cols-1', 'lg:flex lg:justify-between', 'gap-x-4 p-4 pb-0']}>
	<div class="flex items-end justify-between">
		<div>
			{#if parentTitle}
				<div class="mb-1 text-sm tracking-wide text-gray-600 uppercase dark:text-gray-400">
					{parentTitle}
				</div>
			{/if}
			<h1 class="text-3xl font-bold">{pageTitle}</h1>
			{#if subtitle}
				<div class="mt-1 text-xl text-gray-600 dark:text-gray-400">{subtitle}</div>
			{/if}
		</div>
	</div>
	<div>
		{@render buttons?.()}
	</div>
</div>
<div
	class={[
		'grid grid-cols-1',
		'grow gap-x-4 p-4',
		sidebarCollapsed
			? 'lg:grid-cols-[min-content_1fr]'
			: 'lg:grid-cols-[calc(25%-0.5rem)_calc(75%-0.5rem)]'
	]}
>
	<div class="order-2 col-span-1 pb-4 lg:order-3">
		<ContentBox
			noPadding
			class={'flex flex-col items-center' + (sidebarCollapsed ? ' h-full' : '')}
		>
			<div class="flex w-full justify-between">
				<h2
					class={['px-4 pt-4 pb-2 text-lg font-bold text-ellipsis', sidebarCollapsed && 'sr-only']}
				>
					Selection
				</h2>
				<button
					class={[
						'hidden lg:block',
						'rounded-lg text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700',
						'mx-2 mt-2 p-2'
					]}
					onclick={toggleSidebarCollapse}
				>
					{#if sidebarCollapsed}
						<i class="bi bi-chevron-right"></i>
					{:else}
						<i class="bi bi-chevron-left"></i>
					{/if}
					<span class="sr-only">Toggle selection sidebar</span>
				</button>
			</div>
			{#if sidebarCollapsed}
				<div
					class="text-md mt-2 font-bold text-gray-600 [writing-mode:sideways-lr] dark:text-gray-400"
				>
					Selection
				</div>
			{/if}
			<div class={['w-full', sidebarCollapsed && 'sr-only']}>
				{@render filters()}
			</div>
		</ContentBox>
	</div>
	<main class="order-4 col-span-1">
		{@render mainContent()}
	</main>
</div>
