<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { addCurrentSolutionToURL } from '$lib/queryParams.svelte';
	import ToggleThemeButton from './ToggleThemeButton.svelte';

	const transition_urls = {
		Capacity: resolve('/explorer/transition/capacity'),
		Production: resolve('/explorer/transition/production'),
		Emissions: resolve('/explorer/transition/emissions'),
		Costs: resolve('/explorer/transition/costs')
	};

	const energy_balance_urls = {
		Nodal: resolve('/explorer/energy_balance/nodal'),
		Storage: resolve('/explorer/energy_balance/storage')
	};

	let currentPage = $derived(page.url.pathname.slice(0, -1));

	//#region Navigation

	let showSidebarNav: boolean = $state(false);

	function toggleNavigation() {
		showSidebarNav = !showSidebarNav;
	}

	//#endregion
</script>

<nav
	class="flex gap-4 xl:gap-0 xl:grid grid-cols-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2"
>
	<div>
		<a class="text-xl font-semibold inline-flex items-center h-full" href={resolve('/explorer/')}>
			<img src="/logo.png" alt="ZEN-garden Logo" class="inline h-8 mr-2" />
			ZEN-garden
		</a>
	</div>
	<div class="col-span-3 px-2 flex justify-end lg:justify-between items-center flex-1">
		<ul class="hidden lg:flex items-end gap-6 xl:gap-12">
			<li>
				<div class="uppercase tracking-wide text-sm text-gray-400">The Transition Pathway</div>
				<ul class="flex gap-4 2xl:gap-6 text-lg font-semibold">
					{#each Object.entries(transition_urls) as [title, url]}
						<li>
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
				<div class="uppercase tracking-wide text-sm text-gray-400">The Energy Balance</div>
				<ul class="flex gap-4 text-lg font-semibold">
					{#each Object.entries(energy_balance_urls) as [title, url]}
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
				<div class="uppercase tracking-wide text-sm text-gray-400">The Energy System</div>
				<a
					class={[
						'text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-400',
						currentPage == '/explorer/energy_system' && 'border-b-2 pb-1'
					]}
					href={addCurrentSolutionToURL('/explorer/energy_system', false)}>Sankey</a
				>
			</li>
			<li>
				<div class="uppercase tracking-wide text-sm text-gray-400">The Map</div>
				<a
					class={[
						'text-lg font-semibold hover:text-gray-600 dark:hover:text-gray-400',
						currentPage == '/explorer/map' && 'border-b-2 pb-1'
					]}
					href={addCurrentSolutionToURL('/explorer/map', false)}>Map</a
				>
			</li>
		</ul>
		<div class="flex justify-end items-center gap-2">
			<ToggleThemeButton></ToggleThemeButton>
			<button
				class="rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 lg:hidden"
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
		'fixed lg:translate-x-0 transition-transform duration-300',
		'inset-y-0 -right-64 w-64 z-5 h-full overflow-y-auto',
		'bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700',
		showSidebarNav && '-translate-x-full'
	]}
>
	<div class="flex justify-end px-4 py-2">
		<button
			class="rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 p-2"
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
	<div class="px-2 pt-2 pb-3 space-y-1">
		<h2 class="px-3 mb-0 text-gray-500 uppercase tracking-wide text-sm">The Transition Pathway</h2>
		<div class="mb-4">
			{#each Object.entries(transition_urls) as [title, url]}
				<a
					href={addCurrentSolutionToURL(url, true)}
					class="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
					>{title}</a
				>
			{/each}
		</div>
		<h2 class="px-3 mb-0 text-gray-500 uppercase tracking-wide text-sm">The Energy Balance</h2>
		<div class="mb-4">
			{#each Object.entries(energy_balance_urls) as [title, url]}
				<a
					href={addCurrentSolutionToURL(url, false)}
					class="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
					>{title}</a
				>
			{/each}
		</div>
		<h2 class="px-3 mb-0 text-gray-500 uppercase tracking-wide text-sm">The Energy System</h2>
		<a
			href={addCurrentSolutionToURL('/energy_system', false)}
			class="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700 mb-4"
			>Sankey</a
		>
		<h2 class="px-3 mb-0 text-gray-500 uppercase tracking-wide text-sm">The Map</h2>
		<a
			href={addCurrentSolutionToURL('/map', false)}
			class="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
			>Map</a
		>
	</div>
</aside>
