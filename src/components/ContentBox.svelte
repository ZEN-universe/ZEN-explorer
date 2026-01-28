<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		noPadding?: boolean;
		noMarginBottom?: boolean;
		noColor?: boolean;
		noShadow?: boolean;
		noRounded?: boolean;
		id?: string;
	}
	let {
		children,
		class: classNames = '',
		noPadding = false,
		noMarginBottom = false,
		noColor = false,
		noShadow = false,
		noRounded = false,
		id
	}: Props = $props();
</script>

<div
	class={[
		!noColor && 'bg-white dark:bg-gray-800',
		!noShadow && 'shadow-lg shadow-black/10 dark:shadow-white/5',
		!noRounded && 'rounded-lg',
		!noMarginBottom && 'mb-4',
		!noPadding && 'p-4',
		classNames
	]}
	{id}
>
	{@render children()}
</div>
