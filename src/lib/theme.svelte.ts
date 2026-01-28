let theme: 'light' | 'dark' | 'system' = $state(localStorage.theme || 'system');

export function getTheme(): 'light' | 'dark' {
	if (theme === 'system') {
		const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		return isDark ? 'dark' : 'light';
	}
	return theme;
}

export function toggleTheme() {
	theme = getTheme() === 'dark' ? 'light' : 'dark';
	localStorage.theme = theme;
}
