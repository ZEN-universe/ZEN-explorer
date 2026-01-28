<script lang="ts">
	import Navigation from '$components/Navigation.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<Navigation />

{@render children?.()}
