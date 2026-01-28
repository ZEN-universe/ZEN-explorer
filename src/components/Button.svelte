<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick?: () => void;
		children: Snippet;
		class?: string;
		disabled?: boolean;
	}
	let { onclick, children, class: classes = '', disabled = false }: Props = $props();
</script>

<button
	class={[
		'flex',
		'text-blue-800 dark:text-blue-400',
		'rounded-lg border-2 border-blue-800 dark:border-blue-400',
		'hover:bg-gray-300 dark:hover:bg-gray-800',
		'px-4 py-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
		classes
	]}
	{disabled}
	onclick={() => onclick?.()}
>
	{@render children()}
</button>
