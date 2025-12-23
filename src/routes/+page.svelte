<script lang="ts">
	import '@/app.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import 'fullpage.js/dist/fullpage.css';

	// @ts-ignore
	import FullPage from 'fullpage.js';

	import { resolve } from '$app/paths';
	import ToggleThemeButton from '$components/ToggleThemeButton.svelte';
	import ContentBox from '$components/ContentBox.svelte';
	import { onDestroy, onMount } from 'svelte';
	import RRELogo from '$components/RRELogo.svelte';

	// List of publications
	const publications = [
		{
			title: 'ZEN-garden: Optimizing energy transition pathways with user-oriented data handling',
			authors:
				'Jacob Mannhardt, Alissa Ganter, Johannes Burger, Francesco De Marco, Lukas Kunz, Lukas Schmidt-Engelbertz, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'SoftwareX, vol. 29, pp. 102059, Elsevier, 2025.',
			doi: '10.1016/j.softx.2025.102059',
			researchCollection: 'http://hdl.handle.net/20.500.11850/711439'
		},
		{
			title:
				'Understanding the vicious cycle of myopic foresight and constrained technology deployment in transforming the European energy system',
			authors: 'Jacob Mannhardt, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'iScience, vol. 27: no. 12, pp. 111369, Cell Press, 2024.',
			doi: '10.1016/j.isci.2024.111369',
			researchCollection: 'http://hdl.handle.net/20.500.11850/710173'
		},
		{
			title:
				'Near-term infrastructure rollout and investment strategies for net-zero hydrogen supply chains',
			authors: 'Alissa Ganter, Paolo Gabrielli and Giovanni Sansavini',
			journal: 'Renewable and Sustainable Energy Reviews, vol. 194, pp. 114314, Pergamon, 2024.',
			doi: '10.1016/j.rser.2024.114314',
			researchCollection: 'http://hdl.handle.net/20.500.11850/659862'
		}
	];

	let fullPageInstance: FullPage;
	let nav: HTMLElement;

	onMount(() => {
		fullPageInstance = new FullPage('#fullpage', {
			licenseKey: '',
			autoScrolling: true,
			scrollOverflow: true,
			scrollBar: false,
			recordHistory: true,
			navigation: true,
			navigationPosition: 'right',
			anchors: ['header', 'case-studies', 'framework', 'visualization', 'footer'],
			paddingTop: `${nav.offsetHeight}px`,
		});
	});

	onDestroy(() => {
		fullPageInstance.destroy('all');
	});
</script>

<svelte:head>
	<title>ZEN-garden</title>
</svelte:head>

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

<!-- Navbar -->
<nav
	class="fixed inset-x-0 top-0 z-1 border-b border-gray-200 bg-white py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
	bind:this={nav}
>
	<div class="container mx-auto flex justify-between gap-4 px-4">
		<div>
			<a class="inline-flex h-full items-center text-xl font-semibold" href={resolve('/')}>
				<img src="/logo.png" alt="ZEN-garden Logo" class="mr-2 inline h-8" />
				<span class="hidden sm:inline">ZEN-garden</span>
			</a>
		</div>
		<div class="flex items-center gap-2">
			{@render navButton('mailto:zen-garden@ethz.ch', 'Mail to ZEN-garden', 'bi-envelope-fill')}
			{@render navButton(
				'https://groups.google.com/g/zen_garden',
				'ZEN-garden on Google Groups',
				'bi-people-fill'
			)}
			{@render navButton(
				'https://zen-garden.readthedocs.io/',
				'ZEN-garden Documentation',
				'bi-book-half'
			)}
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

<div id="fullpage">
	<!-- Header -->
	<div class="section fp-auto-height-responsive">
		<div class="container mx-auto mt-6 px-4">
			<ContentBox class="mb-4 px-4 py-10 sm:mb-8 sm:px-10 sm:py-16 lg:mb-12 lg:px-20">
				<h1 class="mb-12 text-5xl font-bold lg:text-6xl">Welcome to our ZEN-garden</h1>

				<p class="mb-12 max-w-270 text-xl leading-relaxed">
					Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
					there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
					the Semantics, a large language ocean. A small river named Duden flows by their place and
					supplies it with the necessary regelialia. It is a paradisematic country, in which roasted
					parts of sentences fly into your mouth. Even the all-powerful Pointing has no control
					about the blind texts it is an almost unorthographic life One day however a small line of
					blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar.
				</p>

				<a
					class="inline-block w-full rounded bg-black px-8 py-4 text-center text-xl text-white sm:w-auto dark:bg-gray-100 dark:text-gray-900"
					href="https://zen-garden.readthedocs.io/en/latest/files/quick_start/installation.html"
					target="_blank"
				>
					Getting started
					<i class="bi bi-arrow-up-right"></i>
				</a>
			</ContentBox>
		</div>

		<!-- 3 headline boxes -->
		<div
			class="container mx-auto mb-4 grid gap-4 px-4 sm:grid-cols-3 md:mb-8 md:gap-8 lg:mb-12 lg:gap-12"
		>
			<ContentBox class="relative py-6 text-center lg:py-12" noMarginBottom>
				<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Case Studies</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-signpost-2-fill"></i>
				</div>
				<a
					href="#case-studies"
					class="pointer-event-none absolute inset-0"
					aria-label="Case Studies"
				></a>
			</ContentBox>
			<ContentBox class="relative py-6 text-center lg:py-12" noMarginBottom>
				<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Framework</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-diagram-3-fill"></i>
				</div>
				<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
			</ContentBox>
			<ContentBox class="relative py-6 text-center lg:py-12" noMarginBottom>
				<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Visualization</h2>
				<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
					<i class="bi bi-eye-fill"></i>
				</div>
				<a
					href="#visualization"
					class="pointer-event-none absolute inset-0"
					aria-label="Visualization"
				></a>
			</ContentBox>
		</div>
	</div>

	<!-- Case Studies -->
	<div class="section fp-auto-height-responsive">
		<div class="container mx-auto mt-6 mb-4 flex gap-4 px-4 lg:gap-12 lg:mb-12">
			<ContentBox class="grow" noPadding noMarginBottom>
				<div class="border-b border-gray-200 px-4 py-8 md:px-8 lg:px-12 dark:border-gray-600">
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Case Studies</h2>
					<p class="text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean. Far far away, behind the word mountains, far from
						the countries Vokalia and Consonantia, there live the blind texts. Separated they live
						in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
					</p>
				</div>

				<div class="border-b border-gray-200 px-4 py-8 md:px-8 lg:px-12 dark:border-gray-600">
					<h3 class="mb-4 text-3xl font-bold">ZEN-models</h3>

					<p class="mb-8 text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean. Far far away, behind the word mountains, far from
						the countries Vokalia and Consonantia, there live the blind texts. Separated they live
						in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
					</p>

					<div class="grid gap-4 sm:grid-cols-3">
						<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
							<h3 class="mb-4 text-xl font-bold">Hydrogen</h3>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Description
							</a>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Publications
							</a>
						</div>
						<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
							<h3 class="mb-4 text-xl font-bold">Electricity</h3>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Description
							</a>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Publications
							</a>
						</div>
						<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
							<h3 class="mb-4 text-xl font-bold">Sector-coupled</h3>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Description
							</a>
							<a class="mb-2 block" href="#">
								<i class="bi bi-arrow-right"></i>
								Publications
							</a>
						</div>
					</div>
				</div>

				<div class="px-4 py-8 md:px-8 lg:px-12">
					<h3 class="mb-4 text-3xl font-bold">List of Publications</h3>

					<p class="mb-8 text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean.
					</p>

					<!-- Note: Publications are located at the top of the file -->
					<ul>
						{#each publications as publication, index}
							<li
								class={['border-gray-200 dark:border-gray-600', index > 0 && 'mt-4 border-t pt-4']}
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
									>
										Research Collection
										<i class="bi bi-arrow-up-right"></i>
									</a>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</ContentBox>
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Framework</h2>
				<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
			</ContentBox>
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Visualization</h2>
				<a
					href="#visualization"
					class="pointer-event-none absolute inset-0"
					aria-label="Visualization"
				></a>
			</ContentBox>
		</div>
	</div>

	<!-- Framework -->
	<div class="section fp-auto-height-responsive">
		<div class="container mx-auto mt-6 mb-4 flex gap-4 lg:gap-12 px-4 lg:mb-12">
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Case Studies</h2>
				<a
					href="#case-studies"
					class="pointer-event-none absolute inset-0"
					aria-label="Case Studies"
				></a>
			</ContentBox>
			<ContentBox class="grow px-4 py-8 md:px-8 lg:px-12"	noMarginBottom>
				<h2 class="mb-8 text-4xl sm:text-5xl font-bold">Framework</h2>
				<p class="mb-8 text-lg">
					Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
					there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
					the Semantics, a large language ocean. Far far away, behind the word mountains, far from
					the countries Vokalia and Consonantia, there live the blind texts. Separated they live in
					Bookmarksgrove right at the coast of the Semantics, a large language ocean.
				</p>

				<div class="grid gap-4 sm:grid-cols-3">
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Transition pathways</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Input data handling</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Scaling</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Feature</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Feature</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
					<div class="rounded bg-[#07c59f] px-4 py-4 dark:bg-teal-800">
						<h3 class="mb-4 text-xl font-bold">Feature</h3>
						<p class="mb-2">
							Short text about this super nice feature. I'm sure you know how useful it can be.
						</p>
						<a class="mb-2 block" href="#">
							<i class="bi bi-arrow-right"></i>
							Read more on RtD
						</a>
					</div>
				</div>
			</ContentBox>
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Visualization</h2>
				<a
					href="#visualization"
					class="pointer-event-none absolute inset-0"
					aria-label="Visualization"
				></a>
			</ContentBox>
		</div>
	</div>

	<!-- Visualization -->
	<div class="section fp-auto-height-responsive">
		<div class="container mx-auto mb-4 mt-6 flex gap-4 lg:gap-12 px-4 lg:mb-12">
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Case Studies</h2>
				<a
					href="#case-studies"
					class="pointer-event-none absolute inset-0"
					aria-label="Case Studies"
				></a>
			</ContentBox>
			<ContentBox class="relative hidden py-8 text-center md:block" noMarginBottom>
				<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Framework</h2>
				<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
			</ContentBox>
			<ContentBox class="grow px-4 py-8 md:px-8 lg:px-12" noMarginBottom>
				<h2 class="mb-8 text-4xl sm:text-5xl font-bold">Visualization</h2>
				<p class="mb-12 text-lg">
					Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
					there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
					the Semantics, a large language ocean. Far far away, behind the word mountains, far from
					the countries Vokalia and Consonantia, there live the blind texts. Separated they live in
					Bookmarksgrove right at the coast of the Semantics, a large language ocean.
				</p>

				<div
					class="relative mx-auto grid w-full max-w-250 grid-cols-2 items-center gap-4 text-xl sm:text-3xl font-bold text-white"
				>
					<div
						class="flex min-h-48 items-center justify-center rounded-tl-lg border border-gray-400 bg-[#6e7e2c] p-4 dark:border-gray-800"
					>
						The Transition Pathway
					</div>
					<div
						class="flex min-h-48 items-center justify-center rounded-tr-lg border border-gray-400 bg-[#387e70] p-4 dark:border-gray-800"
					>
						The Energy Balance
					</div>
					<div
						class="flex min-h-48 items-center justify-center rounded-bl-lg border border-gray-400 bg-[#4270a8] p-4 dark:border-gray-800"
					>
						The Energy System
					</div>
					<div
						class="flex min-h-48 items-center justify-center rounded-br-lg border border-gray-400 bg-[#ae995e] p-4 dark:border-gray-800"
					>
						The Map
					</div>

					<div class="pointer-events-none absolute inset-0 hidden place-content-center lg:grid">
						<div class="relative">
							<div class="absolute inset-1 z-0 rounded-full bg-white"></div>
							<img
								class="relative z-1"
								width="220"
								height="220"
								alt="ZEN-garden Logo"
								src="/zen_garden_700x700.png"
							/>
						</div>
					</div>

					<a href="/explorer" class="absolute inset-0" aria-label="Go to ZEN-garden Explorer"></a>
				</div>
			</ContentBox>
		</div>
	</div>

	<!-- Copyright Footer -->
	<div class="section fp-auto-height">
		<footer class="border-t border-gray-200 bg-white py-6 dark:border-gray-600 dark:bg-gray-900">
			<div class="container mx-auto px-4 text-left text-gray-600 dark:text-gray-400">
				&copy; {new Date().getFullYear()} ZEN-garden. All rights reserved.
			</div>
		</footer>
	</div>
</div>
