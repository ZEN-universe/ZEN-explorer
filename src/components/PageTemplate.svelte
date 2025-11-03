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
		<div
			class="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-800 shadow-lg shadow-black/10 dark:shadow-white/5 rounded-lg p-4"
		>
			<h2 class="font-bold text-lg mb-4">Filters</h2>
			<div>
				{@render filters()}
			</div>
		</div>
	</div>
	<main class="col-span-3">
		{@render mainContent()}
	</main>
</div>
