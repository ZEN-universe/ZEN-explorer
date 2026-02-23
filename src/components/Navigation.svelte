<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { addCurrentSolutionToURL } from '$lib/queryParams.svelte';
	import { getTheme, toggleTheme } from '@/lib/theme.svelte';
	import type { ResolvedPathname } from '$app/types';

	const transition_urls: Record<string, ResolvedPathname> = {
		Capacity: resolve('/transition/capacity'),
		Production: resolve('/transition/production'),
		Emissions: resolve('/transition/emissions'),
		Costs: resolve('/transition/costs')
	};

	const energy_balance_urls: Record<string, ResolvedPathname> = {
		Nodal: resolve('/energy_balance/nodal'),
		Storage: resolve('/energy_balance/storage')
	};

	const map_urls: Record<string, ResolvedPathname> = {
		Capacity: resolve('/map/capacity'),
		Production: resolve('/map/production')
	};

	let currentPage = $derived(page.url.pathname.slice(0, -1));

	let theme = $derived(getTheme());

	$effect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
	});

	let showSidebarNav: boolean = $state(false);

	function toggleNavigation() {
		showSidebarNav = !showSidebarNav;
	}
</script>

<nav
	class="flex grid-cols-4 gap-4 border-b border-gray-200 bg-white px-4 py-2 text-gray-800 xl:grid xl:gap-0 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
>
	<div>
		<a class="inline-flex h-full items-center text-xl font-semibold" href={resolve('/')}>
			<img src="/logo.png" alt="ZEN-garden Logo" class="mr-2 inline h-8" />
			ZEN-garden
		</a>
	</div>
	<div class="col-span-3 flex flex-1 items-center justify-end px-2 lg:justify-between">
		<ul class="hidden items-end gap-6 lg:flex xl:gap-12">
			<li>
				<div class="text-sm tracking-wide text-gray-400 uppercase">The Transition Pathway</div>
				<ul class="flex gap-4 text-lg font-semibold 2xl:gap-6">
					{#each Object.entries(transition_urls) as [title, url] (title)}
						<li>
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								class={[
									'hover:text-gray-600 dark:hover:text-gray-400',
									currentPage == url && 'border-b-2 pb-1'
								]}
								href={addCurrentSolutionToURL(url, true)}>{title}</a
							>
						</li>
					{/each}
				</ul>
			</li>
			<li>
				<div class="text-sm tracking-wide text-gray-400 uppercase">The Energy Balance</div>
				<ul class="flex gap-4 text-lg font-semibold">
					{#each Object.entries(energy_balance_urls) as [title, url] (title)}
						<li>
							<a
								class={[
									'hover:text-gray-600 dark:hover:text-gray-400',
									currentPage == url && 'border-b-2 pb-1'
								]}
								href={addCurrentSolutionToURL(url, false)}>{title}</a
							>
						</li>
					{/each}
				</ul>
			</li>
			<li>
				<a
					class={[
						'text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-400',
						currentPage == '/energy_system' && 'border-b-2 pb-1'
					]}
					href={addCurrentSolutionToURL('/energy_system', false)}>The Energy System</a
				>
			</li>
			<li>
				<div class="text-sm tracking-wide text-gray-400 uppercase">The Map</div>
				<ul class="flex gap-4 text-lg font-semibold">
					{#each Object.entries(map_urls) as [title, url] (title)}
						<li>
							<a
								class={[
									'text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-400',
									currentPage == url && 'border-b-2 pb-1'
								]}
								href={addCurrentSolutionToURL(url, false)}>{title}</a
							>
						</li>
					{/each}
				</ul>
			</li>
		</ul>
		<div class="flex items-center justify-end gap-2">
			<button
				class="h-10 w-10 rounded-lg p-2 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
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
			<button
				class="rounded-lg p-2 text-gray-700 hover:bg-gray-200 lg:hidden dark:text-gray-200 dark:hover:bg-gray-700"
				aria-controls="sidebar-nav"
				aria-expanded={showSidebarNav ? 'true' : 'false'}
				aria-label="Toggle navigation"
				onclick={toggleNavigation}
			>
				<svg width="24" height="24" viewBox="0 0 24 24">
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-width="2"
						d="M4 12h16M4 6h16M4 18h16"
					></path>
				</svg>
			</button>
		</div>
	</div>
</nav>

<aside
	id="sidebar-nav"
	class={[
		'block lg:hidden',
		'fixed transition-transform duration-300 lg:translate-x-0',
		'inset-y-0 -right-64 z-5 h-full w-64 overflow-y-auto',
		'border-l border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900',
		showSidebarNav && '-translate-x-full'
	]}
>
	<div class="flex justify-end px-4 py-2">
		<button
			class="rounded-lg p-2 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
			aria-controls="sidebar-nav"
			aria-expanded={showSidebarNav ? 'true' : 'false'}
			aria-label="Toggle navigation"
			onclick={() => (showSidebarNav = false)}
		>
			<svg width="24" height="24" viewBox="0 0 24 24">
				<line
					x1="6"
					y1="6"
					x2="18"
					y2="18"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
				<line
					x1="18"
					y1="6"
					x2="6"
					y2="18"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	</div>
	<div class="space-y-1 px-2 pt-2 pb-3">
		<h2 class="mb-0 px-3 text-sm tracking-wide text-gray-500 uppercase">The Transition Pathway</h2>
		<div class="mb-4">
			{#each Object.entries(transition_urls) as [title, url] (title)}
				<a
					href={addCurrentSolutionToURL(url, true)}
					class="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
					>{title}</a
				>
			{/each}
		</div>
		<h2 class="mb-0 px-3 text-sm tracking-wide text-gray-500 uppercase">The Energy Balance</h2>
		<div class="mb-4">
			{#each Object.entries(energy_balance_urls) as [title, url] (title)}
				<a
					href={addCurrentSolutionToURL(url, false)}
					class="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
					>{title}</a
				>
			{/each}
		</div>
		<a
			href={addCurrentSolutionToURL('/energy_system', false)}
			class="mb-4 block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
			>The Energy System</a
		>
		<a
			href={addCurrentSolutionToURL('/map', false)}
			class="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
			>The Map</a
		>
	</div>
</aside>
