<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		content: Snippet;
		class?: string;
	}
	let { content, class: classNames = '' }: Props = $props();
</script>

<div
	class={[
		'bg-white dark:bg-gray-800',
		'shadow-lg shadow-black/10 dark:shadow-white/5',
		'rounded-lg', 
        'p-4 mb-4',
		classNames
	]}
>
	{@render content()}
</div>
