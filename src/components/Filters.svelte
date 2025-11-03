<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<aside class="col-start-1 row-span-2 bg-white dark:bg-gray-900 border-r border-t border-gray-300 dark:border-gray-800 p-4">
	<h2 class="sr-only">Filters</h2>
	<div>
		{@render children?.()}
	</div>
</aside>
