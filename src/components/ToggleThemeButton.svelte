<script lang="ts">
	import { getTheme, toggleTheme } from '$lib/theme.svelte';

	let theme = $derived(getTheme());

	$effect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
	});
</script>

<button
	class="h-10 w-10 rounded-lg p-2 text-center text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
	onclick={toggleTheme}
	aria-label="Toggle theme"
>
	{#if theme === 'light'}
		<i class="bi bi-sun-fill" id="theme-toggle-light-icon"></i>
	{:else if theme === 'dark'}
		<i class="bi bi-moon-stars-fill" id="theme-toggle-dark-icon"></i>
	{:else}
		<i class="bi bi-palette-fill" id="theme-toggle-dark-icon"></i>
	{/if}
</button>
