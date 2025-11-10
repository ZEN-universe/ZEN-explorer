<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		noPadding?: boolean;
	}
	let { children, class: classNames = '', noPadding = false }: Props = $props();
</script>

<div
	class={[
		'bg-white dark:bg-gray-800',
		'shadow-lg shadow-black/10 dark:shadow-white/5',
		'rounded-lg',
		'mb-4',
		!noPadding && 'p-4',
		classNames
	]}
>
	{@render children()}
</div>
