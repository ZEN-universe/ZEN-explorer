<script lang="ts">
	import type { Snippet } from 'svelte';
	import ContentBox from './ContentBox.svelte';

	interface Props {
		parentTitle: string;
		pageTitle: string;
		filters: Snippet;
		buttons?: Snippet;
		mainContent: Snippet;
	}
	let { parentTitle, pageTitle, filters, buttons, mainContent }: Props = $props();

	let sidebarCollapsed: boolean = $state(false);

	function toggleSidebarCollapse() {
		sidebarCollapsed = !sidebarCollapsed;
	}
</script>

<div class={['grid', 'grid-cols-1 lg:grid-cols-4', 'gap-x-4 p-4 pb-0']}>
	<div class="lg:col-span-1 flex items-end justify-between">
		<div>
			<div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
				{parentTitle}
			</div>
			<h1 class="text-3xl font-bold">{pageTitle}</h1>
		</div>
	</div>
	<div class="lg:col-span-3 order-3 lg:order-2">
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
	<div class="col-span-1 order-2 lg:order-3 pb-4">
		<ContentBox
			noPadding
			class={'flex flex-col items-center' + (sidebarCollapsed ? ' h-full' : '')}
		>
			<div class="flex justify-between w-full">
				<h2
					class={['font-bold text-lg px-4 pt-4 pb-2 text-ellipsis', sidebarCollapsed && 'sr-only']}
				>
					Selection
				</h2>
				<button
					class={[
						'hidden lg:block',
						'rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
						'p-2 mt-2 mx-2'
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
					class="text-md font-bold text-gray-600 dark:text-gray-400 [writing-mode:sideways-lr] mt-2"
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
