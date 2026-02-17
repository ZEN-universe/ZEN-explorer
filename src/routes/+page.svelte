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
			<a
				href="https://github.com/ZEN-universe/ZEN-garden"
				aria-label="ZEN-garden GitHub Repository"
				class="inline-flex h-10 flex-col justify-center rounded-lg p-2 text-center font-bold text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
				target="_blank"
			>
				<img src="/github_logo.svg" alt="GitHub Logo" class="h-6 w-6 dark:invert" />
			</a>
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
		<div class="flex w-full flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-16">
			<img
				src="/favicon.svg"
				alt="ZEN-garden Logo"
				class="w-16 sm:w-16 lg:w-20 xl:w-24"
			/>

			<h1 class="text-5xl font-bold lg:text-6xl">
				Welcome to our ZEN&#8209;garden
			</h1>			
		</div>

		<div>
			<p class="mb-12 text-xl leading-relaxed">
				ZEN-garden is an open-source optimization software to model multi-year energy system transition pathways. 
				To support research focused on the transition of sector-coupled energy systems toward net-zero emissions, 
				ZEN-garden is built upon two principles: 
				Optimizing highly complex sector-coupled energy transition pathways and supporting user-friendly data handling through small, 
				flexible, and robust input datasets. 
			</p>
			
			<h1 class="flex justify-center text-5xl font-bold lg:text-3xl">
				Explore sector-coupled energy transition pathways!
			</h1>
			<!-- add /?solution=technology_optimism_pessimism.Crystal_Ball&tech=conversion&car=electricity to the URL -->
			<div class="flex items-center justify-center"> 
				<a href={resolve('/explorer/map')} target="_blank" class="block dark:hidden flex justify-center mt-8"> 
					<img src="/evolution_map_final.gif" alt="Example transition pathway" class="mx-auto w-full leading-relaxed py-12 sm:w-auto">
				</a>
				<a href={resolve('/explorer/map')} target="_blank" class="hidden dark:block flex justify-center mt-8"> 
					<img src="/evolution_map_final_dark.gif" alt="Example transition pathway" class="mx-auto w-full leading-relaxed py-12 sm:w-auto">
				</a>

			</div>
			

			<div class="flex justify-center">
				<a
					class="opacity-60 transition hover:opacity-100 bg-[#B7352D] dark:bg-[#D48681] inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
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

<!-- 3 headline boxes -->
<div
	class="container mx-auto mb-4 grid gap-4 px-4 sm:grid-cols-3 md:mb-8 lg:mb-12 lg:gap-8 lg:gap-12"
>
	<ContentBox
		class="bg-[#E7F4F7] dark:bg-[#00596D] relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Build your model</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-signpost-2-fill"></i>
		</div>
		<a href="#build-model" class="pointer-event-none absolute inset-0" aria-label="Build your model"
		></a>
	</ContentBox>
	<ContentBox
		class="bg-[#CCE4EA] dark:bg-[#007894] relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Optimize your system</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-diagram-3-fill"></i>
		</div>
		<a href="#optimize-system" class="pointer-event-none absolute inset-0" aria-label="Optimize your system"></a>
	</ContentBox>
	<ContentBox
		class="bg-[#99CAD5] dark:bg-[#3395AB] relative py-6 text-center lg:py-12"
		noMarginBottom
		noColor
	>
		<h2 class="mb-4 mb-6 text-2xl font-bold lg:text-4xl">Visualize your results</h2>
		<div class="text-[80px] leading-none sm:leading-normal md:text-[130px] lg:text-[200px]">
			<i class="bi bi-eye-fill"></i>
		</div>
		<a href="#visualize-results" class="pointer-event-none absolute inset-0" aria-label="Visualize your results"
		></a>
	</ContentBox>
</div>

<div class="mt-12" use:animate={{ topOffset: 57 }}>
	<!-- Build your model -->
	<div id="build-model" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-[#E7F4F7] dark:bg-[#00596D] min-h-screen grow"
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
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Build your model</h2>
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
			class="box bg-[#CCE4EA] dark:bg-[#007894] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Optimize your system</h2>
			<a href="#optimize-system" class="pointer-event-none absolute inset-0" aria-label="Optimize your system"></a>
		</ContentBox>
		<ContentBox
			class="box bg-[#99CAD5] dark:bg-[#3395AB] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Visualize your results</h2>
			<a
				href="#visualize-results"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualize your results"
			></a>
		</ContentBox>
	</div>

	<!-- Optimize your system -->
	<div id="optimize-system" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-[#E7F4F7] dark:bg-[#00596D] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Build your model</h2>
			<a href="#build-model" class="pointer-event-none absolute inset-0" aria-label="Build your model"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-[#CCE4EA] dark:bg-[#007894] min-h-screen grow py-8"
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
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Optimize your system</h2>
					<p class="mb-8 text-lg">
						ZEN-garden optimizes the transition pathways of spatially resolved and sector-coupled energy systems.
						All functionalities can be enabled through input data and configurations, and no adaptation of the codebase is required. 
					</p>
				</div>
			</div>
			<div class="w-full px-4 md:px-8 lg:px-12">
				<div class="my-8 w-full overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-800">
					<div class="p-6 font-mono text-sm leading-relaxed text-slate-300 md:text-base">
						
						<style> @keyframes appear { to { opacity: 1; } } </style>
						
						<div class="flex opacity-0" style="animation: appear 0s linear forwards; animation-delay: 0.5s;">
							<span class="mr-3 select-none text-pink-500">$</span>
							<span>pip install <span class="text-yellow-300">zen-garden</span></span>
						</div>

						<div class="flex opacity-0" style="animation: appear 0s linear forwards; animation-delay: 1.5s;">
							<span class="mr-3 select-none text-pink-500">$</span>
							<span>zen-garden --dataset=<span class="text-cyan-300">my_model</span></span>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 2s;">
							Create ConversionTechnology photovoltaics<br>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 2.25s;">
							Create ConversionTechnology heat_pump<br>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 2.5s;">
							Create Carrier electricity<br>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 2.75s;">
							Create Carrier heat<br>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 3s;">
							...<br>
						</div>

						<div class="text-slate-500 opacity-0" style="animation: appear 0s linear forwards; animation-delay: 4s;">
							--- Optimization finished --- <br>
						</div>

						<div class="flex opacity-0" style="animation: appear 0s linear forwards; animation-delay: 4.5s;">
							<span class="mr-3 select-none text-pink-500">$</span>
							<span>zen-visualization</span>
							<span class="animate-pulse">|</span>
						</div>
					</div>
				</div>
			</div>
			<div class="grid gap-4 px-4 py-8 sm:grid-cols-3 md:px-8 lg:px-12">
				<a 
				class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700"
				href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/dataset_examples.html#multi-year-optimization"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Transition pathways <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						ZEN-garden is specifically designed to optimize multi-year transition pathways.
						The definition of the optimized years is flexible to balance the trade-off between model complexity and pathway resolution.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/05_time_series_aggregation.html#the-time-parameters-in-zen-garden"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Flexible foresight <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						The foresight and decision horizons can be flexibly defined from fully myopic foresight, i.e., a foresight of one optimization step,
						to perfect foresight, i.e., the combined optimization of all optimization steps.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/welcome/features.html#multiple-pre-defined-objective-functions"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Objective functions <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
							ZEN-garden allows for minimizing total net present cost or cumulative emissions.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/dataset_examples.html#brown-field"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Brownfield optimization <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						Existing capacities can be easily specified in the input data to optimize brownfield transition pathways. 
						This allows to analyze the impact of existing capacities on optimal transition pathways.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#technology-diffusion"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Capacity expansion constraints <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						The capacity expansion can be further constrained to consider endogenous technology expansion dynamics, 
						where the new capacity additions are limited by the existing capacity and a technology-specific expansion factor.
						Spatial spillovers, introduction in niche markets, and lead times can be considered as well.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#carbon-emission-modeling"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Emission constraints <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						The transition pathway is guided by emissions constraints. ZEN-garden allows for annual emission constraints, cumulative emission budgets, and carbon pricing.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/zen_garden_in_detail/additional_features.html#retrofitting-technologies"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Retrofitting technologies <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						Technologies can be coupled to model retrofitting options, e.g., to add carbon capture and storage or fuel switching.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/04_scenario_analysis.html"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Scenario analysis <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						ZEN-garden simplifies the analysis of multiple scenarios by overwriting specific input data and configurations of a base model.
						This avoids the need to duplicate the input data and configurations for each scenario.
					</p>
				</a>
				<a class="rounded bg-gray-300 px-4 py-4 dark:bg-gray-700" 
				href="https://zen-garden.readthedocs.io/en/latest/files/tutorial/05_time_series_aggregation.html"
				target="_blank">
					<h3 class="mb-4 text-xl font-bold">Timeseries aggregation <i class="bi bi-arrow-up-right"></i></h3>
					<p class="mb-2">
						ZEN-garden allows for the aggregation of timeseries data to reduce computational complexity while preserving the essential characteristics of the original data.
						The storage level representation method allows for the efficient consideration of short- and long-term storage technologies.
					</p>
				</a>
				
			</div>
		</ContentBox>
		<ContentBox
			class="box bg-[#99CAD5] dark:bg-[#3395AB] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Visualize your results</h2>
			<a
				href="#visualize-results"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualize your results"
			></a>
		</ContentBox>
	</div>

	<!-- Visualize your results -->
	<div id="visualize-results" class="section container mx-auto flex gap-4 px-4 py-4 lg:gap-12">
		<ContentBox
			class="box bg-[#E7F4F7] dark:bg-[#00596D] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Build your model</h2>
			<a href="#build-model" class="pointer-event-none absolute inset-0" aria-label="Build your model"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-[#CCE4EA] dark:bg-[#007894] relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-lr]">Optimize your system</h2>
			<a href="#optimize-system" class="pointer-event-none absolute inset-0" aria-label="Optimize your system"></a>
		</ContentBox>
		<ContentBox
			class="box bg-[#99CAD5] dark:bg-[#3395AB] min-h-screen grow py-8"
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
					<h2 class="mb-8 text-4xl font-bold sm:text-5xl">Visualize your results</h2>
					<p class="mb-12 text-lg">
						ZEN-garden provides a wide range of visualization options to analyze the optimized transition pathways and the underlying optimization results.
						The visualization is available online for published results and locally for user results.
					</p>
					<div class="my-8 w-full overflow-hidden rounded-xl bg-slate-900 shadow-xl ring-1 ring-slate-800">
					<div class="p-6 font-mono text-sm leading-relaxed text-slate-300 md:text-base">
						
						<style> @keyframes appear { to { opacity: 1; } } </style>
						
						<div class="flex opacity-0" style="animation: appear 0s linear forwards; animation-delay: 0.5s;">
							<span class="mr-3 select-none text-pink-500">$</span>
							<span>zen-visualization</span>
						</div>
					</div>
					</div>
					<p class="mb-12 text-lg">
						Annual capacity, production, emission, and cost results can be investigated under 
						<a href={resolve('/explorer/transition/capacity')} class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">The Transition Pathway</a>.
						Energy and storage balances in a specific year can be analyzed under 
						<a href={resolve('/explorer/energy_balance/nodal')} class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">The Energy Balance</a>.
						The flows of energy carriers between technologies can be investigated under 
						<a href={resolve('/explorer/energy_system')} class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">The Energy System</a>.
						Finally, the spatial distribution of capacities can be analyzed under 
						<a href={resolve('/explorer/map')} class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">The Map</a>.
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
				class="shape bg-[#E7F4F7] dark:bg-[#00596D] relative mt-4 hidden w-full py-8 text-center opacity-0 md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Build your model</div>
			</ContentBox>
			<ContentBox
				class="shape bg-[#CCE4EA] dark:bg-[#007894] relative mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Optimize your system</div>
			</ContentBox>
			<ContentBox
				class="shape bg-[#99CAD5] dark:bg-[#3395AB] relative mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Visualize your results</div>
			</ContentBox>
		</div>
	</div>
</div>

<!-- Projects and collaborations -->
<div class="container mx-auto mt-20 px-4">
    <ContentBox
        class="mb-4 flex flex-col gap-8 px-4 py-10 sm:mb-12 sm:py-16 md:px-8 lg:mb-12 lg:px-16 xl:px-20"
    >
        <div class="w-full">
            <h1 class="mb-8 text-4xl font-bold sm:text-5xl md:mb-12 lg:text-6xl">Projects and collaborations</h1>

            <p class="mb-12 w-full text-xl leading-relaxed">
                ZEN-garden is used in various research projects and collaborations. 
                We are happy to share our research and collaborate with other researchers, practitioners, and stakeholders interested in energy system transition pathways. 
            </p>

            <div class="grid w-full grid-cols-4 items-center gap-4 md:gap-8 lg:gap-12">
                
                <a href="https://1komma5.com/en/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/1KOMMA5°_Logo.svg" alt="1KOMMA5°" class="h-auto w-full object-contain">
                </a>

                <a href="https://esc.ethz.ch/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/esc_logo.png" alt="Energy Science Center" class="h-auto w-full object-contain">
                </a>

                <a href="https://sweet-pathfndr.ch/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/PATHFNDR.png" alt="SWEET PATHFNDR" class="h-auto w-full object-contain">
                </a>

                <a href="https://speed2zero.ethz.ch/en/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/Speed2zero.png" alt="Speed2Zero" class="h-auto w-full object-contain">
                </a>
                
                <a href="https://www.projectaccsess.eu/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/accsess.png" alt="Project Accsess" class="h-auto w-full object-contain">
                </a>
                
                
                <a href="https://www.demoupcarma.ethz.ch/" target="_blank" class="flex justify-center transition opacity-60 hover:opacity-100">
                    <img src="/demoupcarma.png" alt="Demo UpCarma" class="h-auto w-full object-contain">
                </a>
                
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
				class="block dark:hidden w-32 sm:w-48 md:w-56 lg:w-96 xl:w-112"
			/>
			<img
				src="/RRE-logo-dark.svg"
				alt="Logo Risk and Reliability Engineering Lab at ETH Zurich"
				class="hidden dark:block w-32 sm:w-48 md:w-56 lg:w-96 xl:w-112"
			/>
		</div>
		<div class="col-span-2">
			<h1 class="mb-8 text-4xl font-bold sm:text-5xl md:mb-12 lg:text-6xl">Contact us</h1>

			<p class="mb-12 max-w-270 text-xl leading-relaxed">
				ZEN-garden is developed by the
				<a href="https://rre.ethz.ch" class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100"
					>Risk and Reliability Engineering Lab at ETH Zurich</a
				> and accessible to everyone as an open-source software via
				<a href="https://github.com/zen-garden" class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">GitHub</a
				> and <a href="https://pypi.org/project/zen-garden/" class="text-[#B7352D] dark:text-[#D48681] font-bold opacity-60 transition hover:opacity-100">PyPI</a>. We are happy to receive feedback, suggestions, and contributions to ZEN-garden. 
				Please do not hesitate to contact us through email or our Google Group.
			</p>

			<div class="flex flex-col gap-4 md:flex-row md:flex-wrap">
				<a
					class="opacity-60 transition hover:opacity-100 bg-[#B7352D] dark:bg-[#D48681] inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
					href="mailto:zen-garden@ethz.ch"
					target="_blank"
				>
					Send us an Email
					<i class="bi bi-arrow-up-right"></i>
				</a>
				<a
					class="opacity-60 transition hover:opacity-100 bg-[#B7352D] dark:bg-[#D48681] inline-block w-full rounded px-8 py-4 text-center text-2xl font-bold text-white sm:w-auto dark:text-black"
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
