<script lang="ts">
	let theme: 'light' | 'dark' | 'system' = $state(localStorage.theme || 'system');

	function toggleTheme() {
		if (theme === 'system') {
			theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
		} else {
			theme = theme === 'dark' ? 'light' : 'dark';
		}
		localStorage.theme = theme;
		(window as any).updateTheme();
	}
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
