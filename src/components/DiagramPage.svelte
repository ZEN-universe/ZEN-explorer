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
</script>

<div class="grid lg:grid-cols-4 grid-rows-[min-content_1fr] grow gap-4 p-4">
	<div class="flex items-end justify-between">
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
	<div class="order-2 lg:order-3">
		<ContentBox noPadding>
			<h2 class="font-bold text-lg px-4 pt-4 pb-2">Selection</h2>
			<div>
				{@render filters()}
			</div>
		</ContentBox>
	</div>
	<main class="lg:col-span-3 order-4">
		{@render mainContent()}
	</main>
</div>
