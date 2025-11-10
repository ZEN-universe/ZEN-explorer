<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick?: () => void;
		children: Snippet;
		class?: string;
	}
	let { onclick, children, class: classes = '' }: Props = $props();
</script>

<button
	class={[
		'flex',
		'text-blue-800 dark:text-blue-400',
		'border-2 border-blue-800 dark:border-blue-400 rounded-lg',
		'px-4 py-2',
		classes
	]}
	onclick={() => onclick?.()}
>
	{@render children()}
</button>
