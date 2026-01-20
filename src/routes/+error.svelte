<script lang="ts">
	import ErrorMessage from '$components/ErrorMessage.svelte';
	import { page } from '$app/state';
</script>

<ErrorMessage message={`${page.status} - ${page.error?.message}`}></ErrorMessage>
