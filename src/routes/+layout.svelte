<script lang="ts">
	import '@/app.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	import { env } from '$env/dynamic/public';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>{env.PUBLIC_APP_NAME || 'ZEN-garden Visualization'}</title>
</svelte:head>

{@render children?.()}

<style lang="postcss">
	@reference "tailwindcss";
</style>
