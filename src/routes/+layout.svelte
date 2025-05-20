<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import 'bootstrap/dist/js/bootstrap.bundle.min.js';

	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { add_current_solution_to_url } from '$lib/url_params.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let transition_urls = {
		Capacity: base + '/transition/capacity',
		Production: base + '/transition/production',
		Emissions: base + '/transition/emissions',
		Costs: base + '/transition/costs'
	};

	let energy_balance_urls = {
		Nodal: base + '/energy_balance/nodal',
		Storage: base + '/energy_balance/storage'
	};

	let currentPage = $derived(page.url.pathname.slice(0, -1));
</script>

<svelte:head>
	<title>{env.PUBLIC_APP_NAME || 'ZEN-garden Visualization'}</title>
</svelte:head>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
	<div class="container">
		<a class="navbar-brand" href="{base}/">ZEN</a>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<li class="nav-item dropdown">
					<a
						class="nav-link dropdown-toggle"
						href="#"
						role="button"
						data-bs-toggle="dropdown"
						aria-expanded="false"
					>
						The Transition Pathway
					</a>
					<ul class="dropdown-menu">
						{#each Object.entries(transition_urls) as [title, url]}
							<li>
								<a
									class={['dropdown-item', currentPage == url && 'active']}
									href={add_current_solution_to_url(url)}>{title}</a
								>
							</li>
						{/each}
					</ul>
				</li>
				<li class="nav-item dropdown">
					<a
						class="nav-link dropdown-toggle"
						href="#"
						role="button"
						data-bs-toggle="dropdown"
						aria-expanded="false"
					>
						The Energy Balance
					</a>
					<ul class="dropdown-menu">
						{#each Object.entries(energy_balance_urls) as [title, url]}
							<li>
								<a
									class={['dropdown-item', currentPage == url && 'active']}
									href={add_current_solution_to_url(url)}>{title}</a
								>
							</li>
						{/each}
					</ul>
				</li>
				<li class="nav-item">
					<a
						href={add_current_solution_to_url('/map')}
						class={['nav-link', currentPage == '/map' && 'active']}>The Map</a
					>
				</li>
			</ul>
		</div>
	</div>
</nav>
<div class="container">
	{@render children?.()}
</div>
