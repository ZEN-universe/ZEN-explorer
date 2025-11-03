<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		title: string;
	}

	let { children, title }: Props = $props();
</script>

<h3 class="sr-only">{title}</h3>
{@render children?.()}
