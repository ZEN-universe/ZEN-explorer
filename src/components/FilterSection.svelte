<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
</script>

<div
	class="border-gray-300 p-4 dark:border-gray-600 [&:first-child]:pt-0 [&:not(:last-child)]:border-b"
>
	<h3 class="sr-only">{title}</h3>
	{@render children?.()}
</div>
