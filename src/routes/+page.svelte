<script lang="ts">
	import '@/app.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	import { resolve } from '$app/paths';
	import ToggleThemeButton from '$components/ToggleThemeButton.svelte';
	import ContentBox from '$components/ContentBox.svelte';
	import RRELogo from '$components/RRELogo.svelte';
	import { animate, refreshAll as refreshAnimation } from '@/lib/frontPageAnimation.svelte';
	import { getTheme } from '@/lib/theme.svelte';
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';

	let nav: HTMLElement;

	// List of publications
	const publications = [
		{
			title: 'ZEN-garden: Optimizing energy transition pathways with user-oriented data handling',
			authors:
				'Jacob Mannhardt, Alissa Ganter, Johannes Burger, Francesco De Marco, Lukas Kunz, Lukas Schmidt-Engelbertz, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'SoftwareX, vol. 29, pp. 102059, Elsevier, 2025.',
			doi: '10.1016/j.softx.2025.102059',
			researchCollection: 'https://hdl.handle.net/20.500.11850/711439'
		},
		{
			title:
				'Understanding the vicious cycle of myopic foresight and constrained technology deployment in transforming the European energy system',
			authors: 'Jacob Mannhardt, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'iScience, vol. 27: no. 12, pp. 111369, Cell Press, 2024.',
			doi: '10.1016/j.isci.2024.111369',
			researchCollection: 'https://hdl.handle.net/20.500.11850/710173'
		},
		{
			title:
				'Near-term infrastructure rollout and investment strategies for net-zero hydrogen supply chains',
			authors: 'Alissa Ganter, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'Renewable and Sustainable Energy Reviews, vol. 194, pp. 114314, Pergamon, 2024.',
			doi: '10.1016/j.rser.2024.114314',
			researchCollection: 'https://hdl.handle.net/20.500.11850/659862'
		}
	];

	let numShownPublications = $state(3);
	let hasMorePublications = $derived(numShownPublications < publications.length);

	function showMorePublications() {
		numShownPublications += 6;
		tick().then(() => {
			refreshAnimation();
		});
	}

	const projects = [
		{
			href: 'https://1komma5.com/en/',
			src: '/1KOMMA5_Logo.svg',
			name: '1KOMMA5°'
		},
		{
			href: 'https://esc.ethz.ch/',
			src: '/esc_logo.png',
			name: 'Energy Science Center'
		},
		{
			href: 'https://sweet-pathfndr.ch/',
			src: '/PATHFNDR.png',
			name: 'SWEET PATHFNDR'
		},
		{
			href: 'https://speed2zero.ethz.ch/en/',
			src: '/Speed2zero.png',
			name: 'Speed2Zero'
		},
		{
			href: 'https://www.projectaccsess.eu/',
			src: '/accsess.png',
			name: 'Project Accsess'
		},
		{
			href: 'https://www.demoupcarma.ethz.ch/',
			src: '/demoupcarma.png',
			name: 'Demo UpCarma'
		},
		{
			href: 'https://www.coreu.eu/',
			src: '/COREu.png',
			name: 'COREu project'
		},
		{
			href: 'https://rre.ethz.ch/research/academic-collaborations/reg4fuels.html',
			src: '/Reg4Fuels.png',
			name: 'Reg4Fuels'
		}
	];

	let isDarkTheme = $derived(getTheme() === 'dark');
</script>

{#snippet navButton(href: string, label: string, iconClass: string)}
	<a
		{href}
		aria-label={label}
		class="h-10 w-10 rounded-lg p-2 text-center text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
		target="_blank"
	>
		<i class="bi {iconClass}"></i>
	</a>
{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<!-- Navbar -->
<nav
	class="fixed inset-x-0 top-0 z-5 border-b border-gray-200 bg-white py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
	bind:this={nav}
>
	<div class="container mx-auto flex justify-between gap-4 px-4">
		<div>
			<a class="inline-flex h-full items-center text-xl font-semibold" href={resolve('/')}>
				<img src="/logo.png" alt="ZEN-garden Logo" class="mr-2 inline h-8" />
				<span class="hidden sm:inline">ZEN&#8209;garden</span>
			</a>
		</div>
		<div class="flex items-center gap-2">
			{@render navButton(
				'https://github.com/ZEN-universe/ZEN-garden',
				'ZEN-garden GitHub Repository',
				'bi-github'
			)}
			{@render navButton(
				'https://zen-garden.readthedocs.io/',
				'ZEN-garden Documentation',
				'bi-book-half'
			)}
			{@render navButton(
				'https://groups.google.com/g/zen_garden',
				'ZEN-garden on Google Groups',
				'bi-people-fill'
			)}
			{@render navButton('mailto:zen-garden@ethz.ch', 'Mail to ZEN-garden', 'bi-envelope-fill')}
			<a
				href="https://rre.ethz.ch/"
				aria-label="Reliability and Risk Engineering Lab at ETH Zurich"
				class="inline-flex h-10 flex-col justify-center rounded-lg p-2 text-center font-bold text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
				target="_blank"
			>
				<RRELogo />
			</a>

			<ToggleThemeButton />
		</div>
	</div>
</nav>

<!-- Header -->
<div class="container mx-auto mt-20 px-4">
	<ContentBox
		class="mb-4 flex w-full flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:px-16 xl:px-20"
		noPadding
	>
		<div class="flex w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-8">
			<img src="/favicon.svg" alt="ZEN-garden Logo" class="w-16 sm:w-16 lg:mx-8 lg:w-20 xl:w-32" />

			<h1 class="text-5xl font-bold lg:text-6xl">Welcome to our ZEN&#8209;garden</h1>
		</div>

		<div>
			<p class="mb-12 text-xl leading-relaxed">
				ZEN-garden is an open-source optimization software to model multi-year energy system
				transition pathways. To support research focused on the transition of sector-coupled energy
				systems toward net-zero emissions, ZEN-garden is built upon two principles: optimizing
				highly complex sector-coupled energy transition pathways and supporting user-friendly data
				handling through small, flexible, and robust input datasets.
			</p>

			<h1 class="flex justify-center text-5xl font-bold lg:text-3xl">
				Explore sector-coupled energy transition pathways!
			</h1>
			<!-- add /?solution=technology_optimism_pessimism.Crystal_Ball&tech=conversion&car=electricity to the URL -->
			<div class="flex items-center justify-center">
				<a href={resolve('/explorer/map/capacity')} class="mt-8 flex justify-center py-12">
					{#if !isDarkTheme}
						<picture>
							<source
								type="image/webp"
								srcset="/opt/evolution_map_final_1344.webp 1344w, /opt/evolution_map_final_1088.webp 1088w, /opt/evolution_map_final_864.webp 864w, /opt/evolution_map_final_672.webp 672w, /opt/evolution_map_final_576.webp 576w"
								sizes="(min-width: 1536px) 1344px, (min-width: 1280px) 1088px, (min-width: 1024px) 864px, (min-width: 768px) 672px, 576px"
							/>
							<img
								src="/opt/evolution_map_final_1344.gif"
								srcset="/opt/evolution_map_final_576.gif 576w, /opt/evolution_map_final_672.gif 672w, /opt/evolution_map_final_864.gif 864w, /opt/evolution_map_final_1088.gif 1088w, /opt/evolution_map_final_1344.gif 1344w"
								sizes="(min-width: 1536px) 1344px, (min-width: 1280px) 1088px, (min-width: 1024px) 864px, (min-width: 768px) 672px, 576px"
								width="1344"
								height="644"
								alt="Example transition pathway"
							/>
						</picture>
					{:else}
						<picture>
							<source
								type="image/webp"
								srcset="/opt/evolution_map_final_dark_1344.webp 1344w, /opt/evolution_map_final_dark_1088.webp 1088w, /opt/evolution_map_final_dark_864.webp 864w, /opt/evolution_map_final_dark_672.webp 672w, /opt/evolution_map_final_dark_576.webp 576w"
								sizes="(min-width: 1536px) 1344px, (min-width: 1280px) 1088px, (min-width: 1024px) 864px, (min-width: 768px) 672px, 576px"
							/>
							<img
								src="/opt/evolution_map_final_dark.gif"
								srcset="/opt/evolution_map_final_dark_576.gif 576w, /opt/evolution_map_final_dark_672.gif 672w, /opt/evolution_map_final_dark_864.gif 864w, /opt/evolution_map_final_dark_1088.gif 1088w, /opt/evolution_map_final_dark_1344.gif 1344w"
								sizes="(min-width: 1536px) 1344px, (min-width: 1280px) 1088px, (min-width: 1024px) 864px, (min-width: 768px) 672px, 576px"
								width="1344"
								height="644"
								alt="Example transition pathway"
							/>
						</picture>
					{/if}
				</a>
			</div>

			<div class="flex justify-center">
				<a
					class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white transition-colors sm:w-auto"
					href="https://zen-garden.readthedocs.io/en/latest/files/quick_start/installation.html"
					target="_blank"
				>
					Get started with ZEN-garden
					<i class="bi bi-arrow-up-right"></i>
				</a>
			</div>
		</div>
	</ContentBox>
</div>

<div class="mt-12" use:animate={{ topOffset: 57 }}>
	<!-- 3 headline boxes -->
	<div id="head-section" class="container mx-auto mb-12 px-4 md:mb-0">
		<div class="grid gap-4 sm:grid-cols-3 lg:gap-12">
			<ContentBox
				class="box relative flex flex-col bg-[#E7F4F7] py-6 text-center lg:py-12 dark:bg-[#00596D]"
				noMarginBottom
				noColor
			>
				<h2 class="mb-4 grow text-2xl font-bold lg:text-4xl">Build your Model</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-signpost-2-fill"></i>
				</div>
				<a
					href="#build-model"
					class="pointer-event-none absolute inset-0"
					aria-label="Build your Model"
				></a>
			</ContentBox>
			<ContentBox
				class="box relative flex flex-col bg-[#CCE4EA] py-6 text-center lg:py-12 dark:bg-[#007894]"
				noMarginBottom
				noColor
			>
				<h2 class="mb-4 grow text-2xl font-bold lg:text-4xl">Optimize your System</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-diagram-3-fill"></i>
				</div>
				<a
					href="#optimize-system"
					class="pointer-event-none absolute inset-0"
					aria-label="Optimize your System"
				></a>
			</ContentBox>
			<ContentBox
				class="box relative flex flex-col bg-[#99CAD5] py-6 text-center lg:py-12 dark:bg-[#3395AB]"
				noMarginBottom
				noColor
			>
				<h2 class="mb-4 grow text-2xl font-bold lg:text-4xl">Visualize your Results</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-eye-fill"></i>
				</div>
				<a
					href="#visualize-results"
					class="pointer-event-none absolute inset-0"
					aria-label="Visualize your Results"
				></a>
			</ContentBox>
		</div>
		<div
			class="bottom-0 hidden flex-col items-center pt-30 text-2xl text-gray-600 lg:flex dark:text-gray-400"
		>
			<div class="font-bold">Scroll Down</div>
			<i class="bi bi-chevron-down animate-bounce py-4"></i>
		</div>
	</div>

	<!-- Build your Model -->
	<div id="build-model" class="section container mx-auto flex gap-4 px-4 pb-12 lg:gap-12 lg:pb-4">
		<ContentBox
			class="box min-h-screen grow bg-[#E7F4F7] dark:bg-[#00596D]"
			noColor
			noPadding
			noMarginBottom
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-200 px-4 pt-8 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] sm:leading-normal lg:text-[200px]">
					<i class="bi bi-signpost-2-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Build your Model</h2>
					<p class="text-lg">
						With ZEN-garden, you can flexibly define the temporal resolution (single/multi year,
						number of time steps per year), the spatial resolution (nodes and edges), and the energy
						sector scope (conversion, storage, transport technologies, and carriers).
					</p>
				</div>
			</div>

			<div class="border-b border-gray-200 px-8 py-8 md:px-16 lg:px-24 dark:border-gray-900">
				<video autoplay loop muted playsinline class="w-full dark:hidden">
					<source
						src="/opt/build_your_model_1184.mp4"
						media="(min-width: 1536px)"
						type="video/mp4"
					/>
					<source
						src="/opt/build_your_model_928.mp4"
						media="(min-width: 1280px)"
						type="video/mp4"
					/>
					<source
						src="/opt/build_your_model_672.mp4"
						media="(min-width: 1024px)"
						type="video/mp4"
					/>
					<source src="/opt/build_your_model_512.mp4" media="(min-width: 768px)" type="video/mp4" />
					<source src="/opt/build_your_model_576.mp4" type="video/mp4" />
					Your browser does not support the video tag
				</video>
				<video autoplay loop muted playsinline class="hidden w-full dark:block">
					<source
						src="/opt/build_your_model_dark_1184.mp4"
						media="(min-width: 1536px)"
						type="video/mp4"
					/>
					<source
						src="/opt/build_your_model_dark_928.mp4"
						media="(min-width: 1280px)"
						type="video/mp4"
					/>
					<source
						src="/opt/build_your_model_dark_672.mp4"
						media="(min-width: 1024px)"
						type="video/mp4"
					/>
					<source
						src="/opt/build_your_model_dark_512.mp4"
						media="(min-width: 768px)"
						type="video/mp4"
					/>
					<source src="/opt/build_your_model_dark_576.mp4" type="video/mp4" />
					Your browser does not support the video tag
				</video>
			</div>

			<div
				class="grid gap-8 border-b border-gray-200 px-4 py-8 md:px-8 lg:gap-12 lg:px-12 xl:grid-cols-2 dark:border-gray-900"
			>
				<div>
					<h3 class="mb-4 text-3xl font-bold">ZEN-creator</h3>

					<p class="mb-8 text-lg">
						A support tool to build your case study of the European sector-coupled transition
						pathway.
					</p>

					<a
						class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 inline-block w-full rounded px-6 py-2 text-center font-bold text-white transition-colors sm:w-auto"
						href="https://github.com/ZEN-universe/ZEN-creator"
						target="_blank"
						rel="external noopener"
					>
						Go to ZEN-creator
						<i class="bi bi-arrow-up-right"></i>
					</a>
				</div>
				<div>
					<h3 class="mb-4 text-3xl font-bold">ZEN-models</h3>

					<p class="mb-4 text-lg">Explore our existing models:</p>

					<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
						<div class="flex flex-col rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
							<h3 class="mb-4 grow text-xl font-bold">Carbon capture and storage</h3>
							<a
								class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 mb-2 block"
								href="https://github.com/ZEN-universe/ZEN-models"
								target="_blank"
								rel="external noopener"
							>
								Go to Model
								<i class="bi bi-arrow-up-right"></i>
							</a>
						</div>
						<div class="flex flex-col rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
							<h3 class="mb-4 grow text-xl font-bold">
								Electricity, heating, industry, and transport
							</h3>
							<a
								class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 mb-2 block"
								href="https://github.com/ZEN-universe/ZEN-models"
								target="_blank"
								rel="external noopener"
							>
								Go to Model
								<i class="bi bi-arrow-up-right"></i>
							</a>
						</div>
						<div class="flex flex-col rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
							<h3 class="mb-4 grow text-xl font-bold">Supply-chain of batteries</h3>
							<a
								class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 mb-2 block"
								href="https://github.com/ZEN-universe/ZEN-models"
								target="_blank"
								rel="external noopener"
							>
								Go to Model
								<i class="bi bi-arrow-up-right"></i>
							</a>
						</div>
					</div>
				</div>
			</div>

			<div class="px-4 py-8 md:px-8 lg:px-12">
				<h3 class="mb-4 text-3xl font-bold">List of Publications</h3>

				<p class="mb-8 text-lg">
					These publications present the ZEN-garden software and its application to analyze
					multi-year transition pathways of sector-coupled energy systems.
				</p>

				<!-- Note: Publications are located at the top of the file -->
				<ul>
					{#each publications.slice(0, numShownPublications) as publication, index (index)}
						<li
							class={['border-gray-300 dark:border-gray-500', index > 0 && 'mt-4 border-t pt-4']}
							transition:fade
						>
							<h4 class="mb-2 text-lg font-bold">
								{publication.title}
							</h4>
							<div class="mb-2">
								{publication.authors}
							</div>
							<div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
								{publication.journal}
							</div>
							<div class="flex flex-wrap gap-4">
								<a
									class="hover:text-gray-600 dark:hover:text-gray-400"
									href={`https://doi.org/${publication.doi}`}
									target="_blank"
								>
									DOI: {publication.doi}
									<i class="bi bi-arrow-up-right"></i>
								</a>
								<a
									class="hover:text-gray-600 dark:hover:text-gray-400"
									href={publication.researchCollection}
									target="_blank"
									rel="external noopener"
								>
									Research Collection
									<i class="bi bi-arrow-up-right"></i>
								</a>
							</div>
						</li>
					{/each}
				</ul>
				{#if hasMorePublications}
					<div class="mt-4 border-t border-gray-300 pt-4 dark:border-gray-500">
						<button
							class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 rounded px-4 py-2 text-white"
							onclick={showMorePublications}
						>
							Show more publications
						</button>
					</div>
				{/if}
			</div>
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">
				Optimize your System
			</h2>
			<a
				href="#optimize-system"
				class="pointer-event-none absolute inset-0"
				aria-label="Optimize your System"
			></a>
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">
				Visualize your Results
			</h2>
			<a
				href="#visualize-results"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualize your Results"
			></a>
		</ContentBox>
	</div>

	<!-- Optimize your System -->
	<div
		id="optimize-system"
		class="section container mx-auto flex gap-4 px-4 pb-12 lg:gap-12 lg:pb-4"
	>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Build your Model</h2>
			<a
				href="#build-model"
				class="pointer-event-none absolute inset-0"
				aria-label="Build your Model"
			></a>
		</ContentBox>
		<ContentBox
			class="box min-h-screen grow bg-[#CCE4EA] py-8 dark:bg-[#007894]"
			noColor
			noMarginBottom
			noPadding
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-200 px-4 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] sm:leading-normal lg:text-[200px]">
					<i class="bi bi-diagram-3-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Optimize your System</h2>
					<p class="mb-8 text-lg">
						ZEN-garden optimizes the transition pathways of spatially resolved and sector-coupled
						energy systems. All functionalities can be enabled through input data and
						configurations, and no adaptation of the codebase is required.
					</p>
				</div>
			</div>
			<div class="border-b border-gray-200 px-8 py-8 md:px-16 lg:px-24 dark:border-gray-900">
				<div
					class="terminal rounded-xl bg-slate-900 p-6 font-mono text-sm leading-relaxed text-slate-300 shadow-xl ring-1 ring-slate-800 md:text-base"
				>
					<!-- Install zen-garden -->
					<div class="flex" data-animate-chars>
						<span class="mr-3 text-pink-500 select-none">$</span>
						<span>pip install <span class="text-yellow-300">zen-garden</span></span>
					</div>
					<div class="text-slate-500">Collecting zen-garden</div>
					<div class="text-slate-500">...</div>
					<div class="text-slate-500">Successfully installed zen-garden-2.9.7</div>

					<!-- Run zen-garden -->
					<div class="flex" data-animate-chars>
						<span class="mr-3 text-pink-500 select-none">$</span>
						<span>zen-garden --dataset=<span class="text-cyan-300">my_model</span></span>
					</div>
					<div class="text-slate-500">Create ConversionTechnology photovoltaics</div>
					<div class="text-slate-500">Create ConversionTechnology heat_pump</div>
					<div class="text-slate-500">Create Carrier electricity</div>
					<div class="text-slate-500">Create Carrier heat</div>
					<div class="text-slate-500">...</div>
					<div class="text-slate-500">--- Optimization finished ---</div>

					<!-- Run visualization -->
					<div class="flex" data-animate-chars>
						<span class="mr-3 text-pink-500 select-none">$</span>
						<span>zen-visualization</span>
					</div>
					<div class="text-slate-500">
						INFO: Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
					</div>
				</div>
			</div>
			<div class="grid gap-4 px-4 py-8 sm:grid-cols-3 md:px-8 lg:px-12">
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/dataset_examples.html#multi-year-optimization"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Transition pathways <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						ZEN-garden is specifically designed to optimize multi-year transition pathways. The
						definition of the optimized years is flexible to balance the trade-off between model
						complexity and pathway resolution.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/05_time_series_aggregation.html#the-time-parameters-in-zen-garden"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Flexible foresight <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						The foresight and decision horizons can be flexibly defined from fully myopic foresight,
						i.e., a foresight of one optimization step, to perfect foresight, i.e., the combined
						optimization of all optimization steps.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/welcome/features.html#multiple-pre-defined-objective-functions"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Objective functions <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						ZEN-garden allows for minimizing total net present cost or cumulative emissions.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/dataset_examples.html#brown-field"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Brownfield optimization <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						Existing capacities can be easily specified in the input data to optimize brownfield
						transition pathways. This allows to analyze the impact of existing capacities on optimal
						transition pathways.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#technology-diffusion"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Capacity expansion constraints <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						The capacity expansion can be further constrained to consider endogenous technology
						expansion dynamics, where the new capacity additions are limited by the existing
						capacity and a technology-specific expansion factor. Spatial spillovers, introduction in
						niche markets, and lead times can be considered as well.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#carbon-emission-modeling"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Emission constraints <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						The transition pathway is guided by emissions constraints. ZEN-garden allows for annual
						emission constraints, cumulative emission budgets, and carbon pricing.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#retrofitting-technologies"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Retrofitting technologies <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						Technologies can be coupled to model retrofitting options, e.g., to add carbon capture
						and storage or fuel switching.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/04_scenario_analysis.html"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Scenario analysis <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						ZEN-garden simplifies the analysis of multiple scenarios by overwriting specific input
						data and configurations of a base model. This avoids the need to duplicate the input
						data and configurations for each scenario.
					</p>
				</a>
				<a
					class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
					href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/05_time_series_aggregation.html"
					target="_blank"
				>
					<h3 class="mb-4 text-xl font-bold">
						Timeseries aggregation <i class="bi bi-arrow-up-right"></i>
					</h3>
					<p class="mb-2">
						ZEN-garden allows for the aggregation of timeseries data to reduce computational
						complexity while preserving the essential characteristics of the original data. The
						storage level representation method allows for the efficient consideration of short- and
						long-term storage technologies.
					</p>
				</a>
			</div>
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">
				Visualize your Results
			</h2>
			<a
				href="#visualize-results"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualize your Results"
			></a>
		</ContentBox>
	</div>

	<!-- Visualize your Results -->
	<div
		id="visualize-results"
		class="section container mx-auto flex gap-4 px-4 pb-12 lg:gap-12 lg:pb-4"
	>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Build your Model</h2>
			<a
				href="#build-model"
				class="pointer-event-none absolute inset-0"
				aria-label="Build your Model"
			></a>
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">
				Optimize your System
			</h2>
			<a
				href="#optimize-system"
				class="pointer-event-none absolute inset-0"
				aria-label="Optimize your System"
			></a>
		</ContentBox>
		<ContentBox
			class="box min-h-screen grow bg-[#99CAD5] py-8 dark:bg-[#3395AB]"
			noColor
			noMarginBottom
			noPadding
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-100 px-4 pb-8 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] sm:leading-normal lg:text-[200px]">
					<i class="bi bi-eye-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Visualize your Results</h2>
					<p class="text-lg">
						ZEN-garden provides a wide range of visualization options to analyze the optimized
						transition pathways and the underlying optimization results. The visualization is
						available online for published results and locally for user results.
					</p>
				</div>
			</div>
			<div class="px-4 pt-8 md:px-8 lg:px-12">
				<div
					class="terminal mx-4 mb-8 rounded-xl bg-slate-900 p-6 font-mono text-sm leading-relaxed text-slate-300 shadow-xl ring-1 ring-slate-800 md:mx-8 md:text-base lg:mx-12"
				>
					<!-- Run visualization -->
					<div class="flex" data-animate-chars>
						<span class="mr-3 text-pink-500 select-none">$</span>
						<span>zen-visualization</span>
					</div>
					<div class="text-slate-500">
						INFO: Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
					</div>
				</div>
				<p class="mb-8 text-lg">
					Annual capacity, production, emission, and cost results can be investigated under
					<a
						href={resolve('/explorer/transition/capacity')}
						class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 font-bold transition-colors"
						>The Transition Pathway</a
					>. Energy and storage balances in a specific year can be analyzed under
					<a
						href={resolve('/explorer/energy_balance/nodal')}
						class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 font-bold transition-colors"
						>The Energy Balance</a
					>. The flows of energy carriers between technologies can be investigated under
					<a
						href={resolve('/explorer/energy_system')}
						class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 font-bold transition-colors"
						>The Energy System</a
					>. Finally, the spatial distribution of capacities can be analyzed under
					<a
						href={resolve('/explorer/map/capacity')}
						class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:tall-poppy-800 font-bold transition-colors"
						>The Map</a
					>.
				</p>

				<div class="relative mx-4 mb-8 md:mx-8 lg:mx-12">
					<img
						src="/windmill_opt.svg"
						alt="Illustration showing the front page of the ZEN-garden Explorer with its four sectors: The Transition Pathway, The Energy Balance, The Energy System, and The Map"
					/>
					<a
						href={resolve('/explorer')}
						class="absolute inset-0"
						aria-label="Go to ZEN-garden Explorer"
					></a>
				</div>

				<a
					class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white transition sm:w-auto"
					href={resolve('/explorer')}
				>
					Visit the Visualization Platform
					<i class="bi bi-arrow-right"></i>
				</a>
			</div>
		</ContentBox>
	</div>
	<!-- Shapes for the animation -->
	<div class="pointer-events-none fixed inset-0">
		<div class="container mx-auto flex h-full gap-4 px-4 lg:gap-12">
			<div class="shape bg-gray-100 py-4 dark:bg-gray-950">
				<ContentBox
					class="hidden h-full w-full bg-[#E7F4F7] py-8 text-center md:block dark:bg-[#00596D]"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Build your Model</div>
				</ContentBox>
			</div>
			<div class="shape bg-gray-100 py-4 dark:bg-gray-950">
				<ContentBox
					class="hidden h-full w-full bg-[#CCE4EA] py-8 text-center md:block dark:bg-[#007894]"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Optimize your System</div>
				</ContentBox>
			</div>
			<div class="shape bg-gray-100 py-4 dark:bg-gray-950">
				<ContentBox
					class="hidden h-full w-full bg-[#99CAD5] py-8 text-center md:block dark:bg-[#3395AB]"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">
						Visualize your Results
					</div>
				</ContentBox>
			</div>
		</div>
	</div>
</div>

<!-- Projects and Collaborations -->
<div class="container mx-auto mt-20 px-4">
	<ContentBox
		class="mb-4 flex flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:px-16 xl:px-20"
	>
		<div class="w-full">
			<h1 class="mb-8 text-4xl font-bold sm:text-5xl md:mb-12 lg:text-6xl">
				Projects and Collaborations
			</h1>

			<p class="mb-12 w-full text-xl leading-relaxed">
				ZEN-garden is used in various research Projects and Collaborations. We are happy to share
				our research and collaborate with other researchers, practitioners, and stakeholders
				interested in energy system transition pathways.
			</p>

			<div class="grid w-full grid-cols-4 items-center gap-4 md:gap-8 lg:gap-12">
				{#each projects as project, idx (idx)}
					<a
						href={project.href}
						class="flex justify-center opacity-60 transition hover:opacity-100"
						target="_blank"
						rel="external noopener"
					>
						<img src={project.src} alt={project.name} class="h-auto w-full object-contain" />
					</a>
				{/each}
			</div>
		</div>
	</ContentBox>
</div>

<!-- Contact -->
<div class="container mx-auto mt-20 px-4">
	<ContentBox
		class="mb-4 flex flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:flex-row lg:gap-20 lg:px-16 xl:px-20 2xl:gap-24"
	>
		<div class="flex items-center justify-center">
			<img
				src="/RRE-logo.svg"
				alt="Logo Risk and Reliability Engineering Lab at ETH Zurich"
				class="block w-32 sm:w-48 md:w-56 lg:w-96 xl:w-md dark:hidden"
			/>
			<img
				src="/RRE-logo-dark.svg"
				alt="Logo Risk and Reliability Engineering Lab at ETH Zurich"
				class="hidden w-32 sm:w-48 md:w-56 lg:w-96 xl:w-md dark:block"
			/>
		</div>
		<div class="col-span-2">
			<h1 class="mb-8 text-4xl font-bold sm:text-5xl md:mb-12 lg:text-6xl">Contact us</h1>

			<p class="mb-12 max-w-270 text-xl leading-relaxed">
				ZEN-garden is developed by the
				<a
					href="https://rre.ethz.ch"
					class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:text-tall-poppy-800 font-bold transition"
					>Risk and Reliability Engineering Lab at ETH Zurich</a
				>
				and accessible to everyone as an open-source software via
				<a
					href="https://github.com/zen-garden"
					class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:text-tall-poppy-800 font-bold transition"
					>GitHub</a
				>
				and
				<a
					href="https://pypi.org/project/zen-garden/"
					class="text-tall-poppy-600 hover:text-tall-poppy-700 dark:text-tall-poppy-700 dark:hover:text-tall-poppy-800 font-bold transition"
					>PyPI</a
				>. We are happy to receive feedback, suggestions, and contributions to ZEN-garden. Please do
				not hesitate to contact us through email or our Google Group.
			</p>

			<div class="flex flex-col gap-4 md:flex-row md:flex-wrap">
				<a
					class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white transition sm:w-auto"
					href="mailto:zen-garden@ethz.ch"
					target="_blank"
				>
					Send us an Email
					<i class="bi bi-arrow-up-right"></i>
				</a>
				<a
					class="bg-tall-poppy-600 hover:bg-tall-poppy-700 dark:bg-tall-poppy-700 dark:hover:bg-tall-poppy-800 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white transition sm:w-auto"
					href="https://groups.google.com/g/zen_garden"
					target="_blank"
					rel="external noopener"
				>
					Discover our Google Group
					<i class="bi bi-arrow-up-right"></i>
				</a>
			</div>
		</div>
	</ContentBox>
</div>

<!-- Copyright Footer -->
<div class="section fp-auto-height mt-12">
	<footer class="border-t border-gray-200 bg-white py-6 dark:border-gray-600 dark:bg-gray-900">
		<div class="container mx-auto px-4 text-left text-gray-600 dark:text-gray-400">
			&copy; {new Date().getFullYear()} ZEN-garden. All rights reserved.
		</div>
	</footer>
</div>

<style>
	.appear {
		animation: appear 0s linear forwards;
	}

	@keyframes appear {
		to {
			opacity: 1;
		}
	}
</style>
