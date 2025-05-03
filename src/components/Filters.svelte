<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="z-1 position-relative">
	<div class="accordion" id="accordionFilters">
		{@render children?.()}
	</div>
</div>
