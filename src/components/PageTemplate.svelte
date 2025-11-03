<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		parentTitle: string;
		pageTitle: string;
		filters: Snippet;
		buttons?: Snippet;
		mainContent: Snippet;
	}
	let { parentTitle, pageTitle, filters, buttons, mainContent }: Props = $props();
</script>

<div class="grid grid-cols-4 grid-rows-[min-content_1fr] grow">
	<div class="col-span-1 p-4 flex items-end justify-between">
		<div>
			<div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
				{parentTitle}
			</div>
			<h1 class="text-3xl font-bold">{pageTitle}</h1>
		</div>
	</div>
	<div class="col-start-2 col-span-3 p-4">
		{@render buttons?.()}
	</div>
	<!-- class="col-start-1 row-span-2 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-800 p-4" -->
	<aside
		class="col-start-1 row-start-2 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-800 rounded-lg p-4 ms-4 mb-4"
	>
		<h2 class="sr-only">Filters</h2>
		<div>
			{@render filters()}
		</div>
	</aside>
	<main class="col-start-2 col-span-3 px-4 pb-4">
		{@render mainContent()}
	</main>
</div>
