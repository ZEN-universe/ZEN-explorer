<script lang="ts">
	import '@/app.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	import { resolve } from '$app/paths';
	import ToggleThemeButton from '$components/ToggleThemeButton.svelte';
	import ContentBox from '$components/ContentBox.svelte';

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
	class="border-b border-gray-200 bg-white px-4 py-2 text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
>
	<div class="container mx-auto flex justify-between gap-4">
		<div>
			<a class="inline-flex h-full items-center text-xl font-semibold" href={resolve('/')}>
				<img src="/logo.png" alt="ZEN-garden Logo" class="mr-2 inline h-8" />
				ZEN-garden
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
				<svg height="20" width="20" viewBox="0 0 94.256 103.68">
					<g transform="matrix(1.3333 0 0 -1.3333 0 133.06)">
						<g transform="scale(.1)" fill="currentColor">
							<path
								d="m425.2 597.14c0-117.42-95.183-212.6-212.6-212.6-117.41 0-212.6 95.183-212.6 212.6 0 117.41 95.184 212.6 212.6 212.6 117.41 0 212.6-95.183 212.6-212.6"
							/>
							<path
								d="m605.86 604.35c-35.226 25.894-78.726 41.195-125.8 41.195-20.344 0-40.032-2.863-58.661-8.199-14.382 75.14-68.316 136.23-139.3 160.78 6.59 111.48 99.086 199.85 212.22 199.85 117.41 0 212.6-95.184 212.6-212.6 0-76.512-40.414-143.58-101.06-181.03"
							/>
							<path
								d="m368.53 613.97c-52.644 38.699-86.804 101.06-86.804 171.41 0 4.277 0.125 8.527 0.375 12.746 70.988-24.547 124.92-85.637 139.3-160.78-18.828-5.391-36.578-13.313-52.875-23.375"
							/>
							<path
								d="m480.06 220.35c-103.67 0-190.01 74.203-208.8 172.39 84.968 24.336 148.16 100.22 153.56 191.66 21.778-7.527 45.164-11.621 69.5-11.621 40.907 0 79.114 11.555 111.54 31.575 52.641-38.696 86.801-101.06 86.801-171.41 0-117.41-95.183-212.6-212.6-212.6"
							/>
							<path
								d="m271.26 392.74c-2.492 13.02-3.797 26.461-3.797 40.203 0 76.512 40.414 143.58 101.06 181.03 17.008-12.504 35.953-22.543 56.293-29.575-5.402-91.433-68.59-167.32-153.56-191.66"
							/>
							<path
								d="m494.32 572.78c-24.336 0-47.722 4.094-69.5 11.621 0.25 4.215 0.375 8.469 0.375 12.747 0 13.746-1.304 27.183-3.793 40.203 18.629 5.336 38.317 8.199 58.661 8.199 47.07 0 90.57-15.301 125.8-41.195-32.425-20.02-70.632-31.575-111.54-31.575"
							/>
							<path
								d="m424.82 584.4c-20.34 7.032-39.285 17.071-56.293 29.575 16.297 10.062 34.047 17.984 52.875 23.375 2.489-13.02 3.793-26.457 3.793-40.203 0-4.278-0.125-8.532-0.375-12.747"
							/>
							<path
								d="m283.65 597.66 164.55-98.894v200.81zm183.94-203.89-281.34 169.08-0.453 68.293 281.34 174.25 61.058-34.004v-343.34l-60.605-34.29"
								class="fill-white dark:fill-gray-800"
							/>
						</g>
					</g>
				</svg>
			</a>

			<ToggleThemeButton />
		</div>
	</div>
</nav>

<!-- Header -->
<div class="container mx-auto mt-8">
	<ContentBox class="mb-12 px-20 py-20">
		<h1 class="mb-12 text-5xl font-bold">Welcome to our ZEN-garden</h1>

		<p class="mb-12 max-w-270 text-xl leading-relaxed">
			Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there
			live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
			Semantics, a large language ocean. A small river named Duden flows by their place and supplies
			it with the necessary regelialia. It is a paradisematic country, in which roasted parts of
			sentences fly into your mouth. Even the all-powerful Pointing has no control about the blind
			texts it is an almost unorthographic life One day however a small line of blind text by the
			name of Lorem Ipsum decided to leave for the far World of Grammar.
		</p>

		<a
			class="rounded bg-black px-8 py-4 text-xl text-white dark:bg-gray-100 dark:text-gray-900"
			href="https://zen-garden.readthedocs.io/en/latest/files/quick_start/installation.html"
			target="_blank"
		>
			Getting started
			<i class="bi bi-arrow-up-right"></i>
		</a>
	</ContentBox>
</div>

<!-- 3 headline boxes -->
<div class="container mx-auto mb-12 grid grid-cols-3 gap-12">
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold">Case Studies</h2>
		<div class="text-[200px]">
			<i class="bi bi-signpost-2-fill"></i>
		</div>
	</ContentBox>
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold">Framework</h2>
		<div class="text-[200px]">
			<i class="bi bi-diagram-3-fill"></i>
		</div>
	</ContentBox>
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold">Visualization</h2>
		<div class="text-[200px]">
			<i class="bi bi-eye-fill"></i>
		</div>
	</ContentBox>
</div>

<!-- Case Studies -->
<div class="container mx-auto mb-24 flex gap-12">
	<ContentBox class="grow px-12 py-8">
		<h2 class="mb-5 text-4xl font-bold">Case Studies</h2>
		<p class="mb-12 text-lg">
			Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there
			live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
			Semantics, a large language ocean. Far far away, behind the word mountains, far from the
			countries Vokalia and Consonantia, there live the blind texts. Separated they live in
			Bookmarksgrove right at the coast of the Semantics, a large language ocean.
		</p>

		<h3 class="mb-4 text-2xl font-bold">ZEN-models</h3>

		<p class="mb-4">
			Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there
			live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
			Semantics, a large language ocean. Far far away, behind the word mountains, far from the
			countries Vokalia and Consonantia, there live the blind texts. Separated they live in
			Bookmarksgrove right at the coast of the Semantics, a large language ocean.
		</p>

		<div class="mb-12 grid grid-cols-3 gap-4">
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

		<h3 class="mb-4 text-2xl font-bold">List of Publications</h3>

		<!-- Note: Publications are located at the top of the file -->
		<ul>
			{#each publications as publication}
				<li class="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
					<h4 class="mb-2 text-lg font-bold">
						{publication.title}
					</h4>
					<div class="mb-2">
						{publication.authors}
					</div>
					<div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
						{publication.journal}
					</div>
					<div>
						<a
							class="hover:text-gray-600 dark:hover:text-gray-400"
							href={`https://doi.org/${publication.doi}`}
							target="_blank"
						>
							DOI: {publication.doi}
							<i class="bi bi-arrow-up-right"></i>
						</a>
						<a
							class="ms-4 hover:text-gray-600 dark:hover:text-gray-400"
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
	</ContentBox>
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Framework</h2>
	</ContentBox>
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Visualization</h2>
	</ContentBox>
</div>

<!-- Framework -->
<div class="container mx-auto mb-24 flex gap-12">
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Case Studies</h2>
	</ContentBox>
	<ContentBox class="grow px-12 py-8">
		<h2 class="mb-5 text-4xl font-bold">Framework</h2>
		<p class="mb-8 text-lg">
			Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there
			live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
			Semantics, a large language ocean. Far far away, behind the word mountains, far from the
			countries Vokalia and Consonantia, there live the blind texts. Separated they live in
			Bookmarksgrove right at the coast of the Semantics, a large language ocean.
		</p>

		<div class="grid grid-cols-3 gap-4">
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
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Visualization</h2>
	</ContentBox>
</div>

<!-- Visualization -->
<div class="container mx-auto mb-24 flex gap-12">
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Case Studies</h2>
	</ContentBox>
	<ContentBox class="py-8 text-center">
		<h2 class="mb-4 text-2xl font-bold [writing-mode:sideways-lr]">Framework</h2>
	</ContentBox>
	<ContentBox class="grow px-12 py-8">
		<h2 class="mb-5 text-4xl font-bold">Visualization</h2>
		<p class="mb-12 text-lg">
			Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there
			live the blind texts. Separated they live in Bookmarksgrove right at the coast of the
			Semantics, a large language ocean. Far far away, behind the word mountains, far from the
			countries Vokalia and Consonantia, there live the blind texts. Separated they live in
			Bookmarksgrove right at the coast of the Semantics, a large language ocean.
		</p>

		<div
			class="relative mx-auto mb-12 grid w-full max-w-250 grid-cols-2 items-center gap-4 text-3xl font-bold text-white"
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
					<img class="relative z-1" width="220" height="220" alt="ZEN-garden Logo" src="/zen_garden_700x700.png" />
				</div>
			</div>

			<a href="/explorer" class="absolute inset-0" aria-label="Go to ZEN-garden Explorer"></a>
		</div>
	</ContentBox>
</div>

<!-- Copyright Footer -->
<footer class="border-t border-gray-200 bg-white py-6 dark:border-gray-600 dark:bg-gray-900">
	<div class="container mx-auto text-center text-gray-600 dark:text-gray-400">
		&copy; {new Date().getFullYear()} ZEN-garden. All rights reserved.
	</div>
</footer>
