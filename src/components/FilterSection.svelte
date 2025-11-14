<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
</script>

<div class="px-4 [&:not(:last-child)]:border-b border-gray-300 dark:border-gray-600 py-2">
	<h3 class="sr-only">{title}</h3>
	{@render children?.()}
</div>
