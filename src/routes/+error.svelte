<script lang="ts">
	import Navigation from '$components/Navigation.svelte';
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import { page } from '$app/state';
</script>

<Navigation />

<ErrorMessage message={`${page.status} - ${page.error?.message}`}></ErrorMessage>

