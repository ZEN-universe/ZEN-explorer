<script lang="ts">
	import '@/app.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	import { resolve } from '$app/paths';
	import ToggleThemeButton from '$components/ToggleThemeButton.svelte';
	import ContentBox from '$components/ContentBox.svelte';
	import RRELogo from '$components/RRELogo.svelte';
	import { animate } from '@/lib/frontPageAnimation.svelte';

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
	class="fixed inset-x-0 top-0 z-1 border-b border-gray-200 bg-white py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
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

<!-- Header -->
<div class="container mx-auto mt-20 px-4">
	<ContentBox
		class="mb-4 flex flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:flex-row lg:gap-20 lg:px-16 xl:px-20 2xl:gap-24"
		noPadding
	>
		<div class="order-1 lg:order-0">
			<h1 class="mb-8 text-5xl font-bold lg:mb-12 lg:text-6xl">Welcome to our ZEN&#8209;garden</h1>

			<p class="mb-12 max-w-270 text-xl leading-relaxed">
				Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
				there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
				Semantics, a large language ocean. A small river named Duden flows by their place and
				supplies it with the necessary regelialia. It is a paradisematic country, in which roasted
				parts of sentences fly into your mouth. Even the all-powerful Pointing has no control about
				the blind texts it is an almost unorthographic life One day however a small line of blind
				text by the name of Lorem Ipsum decided to leave for the far World of Grammar.
			</p>

			<a
				class="bg-viridian-600 dark:bg-viridian-400 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
				href="https://zen-garden.readthedocs.io/en/latest/files/quick_start/installation.html"
				target="_blank"
			>
				Documentation
				<i class="bi bi-arrow-up-right"></i>
			</a>
		</div>
		<div class="order-0 flex items-center justify-center lg:order-1">
			<img
				src="/zen_garden_700x700.png"
				alt="ZEN-garden Logo"
				class="w-48 sm:w-64 lg:w-96 xl:w-112"
			/>
		</div>
	</ContentBox>
</div>

<!-- 3 headline boxes -->
<div
	class="container mx-auto mb-4 grid gap-4 px-4 sm:grid-cols-3 md:mb-8 lg:mb-12 lg:gap-8 lg:gap-12"
>
	<ContentBox
		class="bg-pacifika-200 dark:bg-pacifika-800 relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Case Studies</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-signpost-2-fill"></i>
		</div>
		<a href="#case-studies" class="pointer-event-none absolute inset-0" aria-label="Case Studies"
		></a>
	</ContentBox>
	<ContentBox
		class="bg-san-marino-200 dark:bg-san-marino-800 relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Framework</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-diagram-3-fill"></i>
		</div>
		<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
	</ContentBox>
	<ContentBox
		class="bg-teak-200 dark:bg-teak-800 relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Visualization</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-eye-fill"></i>
		</div>
		<a href="#visualization" class="pointer-event-none absolute inset-0" aria-label="Visualization"
		></a>
	</ContentBox>
</div>

<div class="mt-12" use:animate={{ topOffset: 57 }}>
	<!-- Case Studies -->
	<div id="case-studies" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 min-h-screen grow"
			noColor
			noPadding
			noMarginBottom
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-100 px-4 py-8 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] sm:leading-normal lg:text-[200px]">
					<i class="bi bi-signpost-2-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Case Studies</h2>
					<p class="text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean. Far far away, behind the word mountains, far from
						the countries Vokalia and Consonantia, there live the blind texts. Separated they live
						in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
					</p>
				</div>
			</div>

			<div class="border-b border-gray-100 px-4 py-8 md:px-8 lg:px-12 dark:border-gray-900">
				<h3 class="mb-4 text-3xl font-bold">ZEN-models</h3>

				<p class="mb-8 text-lg">
					Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
					there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
					the Semantics, a large language ocean. Far far away, behind the word mountains, far from
					the countries Vokalia and Consonantia, there live the blind texts. Separated they live in
					Bookmarksgrove right at the coast of the Semantics, a large language ocean.
				</p>

				<div class="grid gap-4 sm:grid-cols-3">
					<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
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
					<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
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
					<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
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
					{#each publications as publication, index (index)}
						<li class={['border-gray-200 dark:border-gray-600', index > 0 && 'mt-4 border-t pt-4']}>
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
			</div>
		</ContentBox>
		<ContentBox
			class="box bg-san-marino-200 dark:bg-san-marino-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Framework</h2>
			<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
		</ContentBox>
		<ContentBox
			class="box bg-teak-200 dark:bg-teak-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Visualization</h2>
			<a
				href="#visualization"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualization"
			></a>
		</ContentBox>
	</div>

	<!-- Framework -->
	<div id="framework" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Case Studies</h2>
			<a href="#case-studies" class="pointer-event-none absolute inset-0" aria-label="Case Studies"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-san-marino-200 dark:bg-san-marino-800 min-h-screen grow py-8"
			noColor
			noMarginBottom
			noPadding
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-100 px-4 py-8 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] lg:text-[200px]">
					<i class="bi bi-diagram-3-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Framework</h2>
					<p class="mb-8 text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean. Far far away, behind the word mountains, far from
						the countries Vokalia and Consonantia, there live the blind texts. Separated they live
						in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
					</p>
				</div>
			</div>

			<div class="grid gap-4 px-4 py-8 sm:grid-cols-3 md:px-8 lg:px-12">
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
					<h3 class="mb-4 text-xl font-bold">Transition pathways</h3>
					<p class="mb-2">
						Short text about this super nice feature. I'm sure you know how useful it can be.
					</p>
					<a class="mb-2 block" href="#">
						<i class="bi bi-arrow-right"></i>
						Read more on RtD
					</a>
				</div>
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
					<h3 class="mb-4 text-xl font-bold">Input data handling</h3>
					<p class="mb-2">
						Short text about this super nice feature. I'm sure you know how useful it can be.
					</p>
					<a class="mb-2 block" href="#">
						<i class="bi bi-arrow-right"></i>
						Read more on RtD
					</a>
				</div>
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
					<h3 class="mb-4 text-xl font-bold">Scaling</h3>
					<p class="mb-2">
						Short text about this super nice feature. I'm sure you know how useful it can be.
					</p>
					<a class="mb-2 block" href="#">
						<i class="bi bi-arrow-right"></i>
						Read more on RtD
					</a>
				</div>
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
					<h3 class="mb-4 text-xl font-bold">Feature</h3>
					<p class="mb-2">
						Short text about this super nice feature. I'm sure you know how useful it can be.
					</p>
					<a class="mb-2 block" href="#">
						<i class="bi bi-arrow-right"></i>
						Read more on RtD
					</a>
				</div>
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
					<h3 class="mb-4 text-xl font-bold">Feature</h3>
					<p class="mb-2">
						Short text about this super nice feature. I'm sure you know how useful it can be.
					</p>
					<a class="mb-2 block" href="#">
						<i class="bi bi-arrow-right"></i>
						Read more on RtD
					</a>
				</div>
				<div class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700">
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
		<ContentBox
			class="box bg-teak-200 dark:bg-teak-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Visualization</h2>
			<a
				href="#visualization"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualization"
			></a>
		</ContentBox>
	</div>

	<!-- Visualization -->
	<div id="visualization" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Case Studies</h2>
			<a href="#case-studies" class="pointer-event-none absolute inset-0" aria-label="Case Studies"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-san-marino-200 dark:bg-san-marino-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Framework</h2>
			<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
		</ContentBox>
		<ContentBox
			class="box bg-teak-200 dark:bg-teak-800 min-h-screen grow py-8"
			noColor
			noMarginBottom
			noPadding
		>
			<div
				class="flex flex-col items-center gap-8 border-b border-gray-100 px-4 py-8 md:flex-row md:px-8 lg:gap-16 lg:px-12 dark:border-gray-900"
			>
				<div class="text-[80px] leading-none sm:text-[130px] sm:leading-normal lg:text-[200px]">
					<i class="bi bi-eye-fill"></i>
				</div>
				<div>
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Visualization</h2>
					<p class="mb-12 text-lg">
						Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
						there live the blind texts. Separated they live in Bookmarksgrove right at the coast of
						the Semantics, a large language ocean. Far far away, behind the word mountains, far from
						the countries Vokalia and Consonantia, there live the blind texts. Separated they live
						in Bookmarksgrove right at the coast of the Semantics, a large language ocean.
					</p>
				</div>
			</div>

			<div
				class="relative mx-auto grid w-full max-w-250 grid-cols-2 items-center gap-4 px-4 py-8 text-xl font-bold text-white sm:text-3xl md:px-8 lg:px-12"
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

				<a
					href={resolve('/explorer')}
					class="absolute inset-0"
					aria-label="Go to ZEN-garden Explorer"
				></a>
			</div>
		</ContentBox>
	</div>
	<!-- Shapes for the animation -->
	<div class="pointer-events-none fixed inset-x-0 top-[57px] bottom-0">
		<div class="container mx-auto flex h-full gap-4 px-4 lg:gap-12">
			<ContentBox
				class="shape bg-pacifika-200 dark:bg-pacifika-800 relative mt-4 hidden w-full py-8 text-center opacity-0 md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Case Studies</div>
			</ContentBox>
			<ContentBox
				class="shape bg-san-marino-200 dark:bg-san-marino-800 relative mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Framework</div>
			</ContentBox>
			<ContentBox
				class="shape bg-teak-200 dark:bg-teak-800 relative mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Visualization</div>
			</ContentBox>
		</div>
	</div>
</div>

<div class="container mx-auto mt-20 px-4">
	<ContentBox
		class="mb-4 flex flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:flex-row lg:gap-20 lg:px-16 xl:px-20 2xl:gap-24"
	>
		<div class="flex items-center justify-center">
			<img
				src="/rre-icon.svg"
				alt="Logo Risk and Reliability Engineering Lab at ETH Zurich"
				class="w-32 sm:w-48 md:w-56 lg:w-96 xl:w-112"
			/>
		</div>
		<div class="col-span-2">
			<h1 class="mb-8 text-4xl font-bold sm:text-5xl md:mb-12 lg:text-6xl">Contact us</h1>

			<p class="mb-12 max-w-270 text-xl leading-relaxed">
				Far far away, behind the word mountains, far from the countries Vokalia and Consonantia,
				there live the blind texts of
				<a href="https://rre.ethz.ch" class="text-viridian-600 dark:text-viridian-400 font-bold"
					>Risk and Reliability Engineering Lab at ETH Zurich</a
				>. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large
				language ocean. A small river named Duden flows by their place and supplies it with the
				necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly
				into your mouth. Even the all-powerful Pointing has no control about the blind texts it is
				an almost unorthographic life One day however a small line of blind text by the name of
				Lorem Ipsum decided to leave for the far World of Grammar.
			</p>

			<div class="flex flex-col gap-4 md:flex-row md:flex-wrap">
				<a
					class="bg-viridian-600 dark:bg-viridian-400 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
					href="mailto:zen-garden@ethz.ch"
					target="_blank"
				>
					Send us an Email
					<i class="bi bi-arrow-up-right"></i>
				</a>
				<a
					class="bg-viridian-600 dark:bg-viridian-400 inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
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
