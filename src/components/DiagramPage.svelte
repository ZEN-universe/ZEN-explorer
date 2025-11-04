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

<div class="grid grid-cols-4 grid-rows-[min-content_1fr] grow gap-4 p-4">
	<div class="flex items-end justify-between">
		<div>
			<div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
				{parentTitle}
			</div>
			<h1 class="text-3xl font-bold">{pageTitle}</h1>
		</div>
	</div>
	<div class="col-span-3">
		{@render buttons?.()}
	</div>
	<div>
		<ContentBox>
			{#snippet content()}
				<h2 class="font-bold text-lg mb-4">Filters</h2>
				<div>
					{@render filters()}
				</div>
			{/snippet}
		</ContentBox>
	</div>
	<main class="col-span-3">
		{@render mainContent()}
	</main>
</div>
