<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
</script>

<div
	class="[&:not(:last-child)]:border-b border-gray-300 dark:border-gray-600 p-4 [&:first-child]:pt-0"
>
	<h3 class="sr-only">{title}</h3>
	{@render children?.()}
</div>
