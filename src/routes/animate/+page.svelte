<script lang="ts">
	import '@/app.css';

	import ContentBox from '$components/ContentBox.svelte';
	import { animate } from '@/lib/frontPageAnimation.svelte';
</script>

<!-- eslint-disable -->
<section class="my-8 text-center">
	<h1 class="mb-4 text-5xl font-bold sm:text-6xl lg:text-7xl">Animate on Scroll</h1>
	{#each Array(24) as _}
		<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
			An example of animating elements based on scroll position using GSAP and Svelte.
		</p>
	{/each}
</section>

<div class="relative" use:animate>
	<div id="head-section" class="container mx-auto px-4">
		<div class="grid grid-cols-3 gap-4 lg:gap-12">
			<ContentBox
				class="box bg-pacifika-200 dark:bg-pacifika-800 py-8 text-center"
				noColor
				noMarginBottom
			>
				<div class="my-20 text-5xl font-bold">Case Studies</div>
			</ContentBox>
			<ContentBox
				class="box bg-san-marino-200 dark:bg-san-marino-800 py-8 text-center"
				noColor
				noMarginBottom
			>
				<div class="my-20 text-5xl font-bold">Framework</div>
			</ContentBox>
			<ContentBox class="box bg-teak-200 dark:bg-teak-800 py-8 text-center" noColor noMarginBottom>
				<div class="my-20 text-5xl font-bold">Visualization</div>
			</ContentBox>
		</div>
		<div
			class="bottom-0 hidden flex-col items-center pt-30 text-2xl text-gray-600 lg:flex dark:text-gray-400"
		>
			<div class="font-bold">Scroll Down</div>
			<i class="bi bi-chevron-down animate-bounce py-4"></i>
		</div>
	</div>

	<div id="case-studies" class="section container mx-auto flex gap-4 px-4 pb-4 lg:gap-12">
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 relative min-h-screen grow px-12 py-8"
			noColor
			noPadding
			noMarginBottom
		>
			<h2 class="top-0 mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Case Studies</h2>

			{#each Array(15) as _}
				<p>
					Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
					pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu
					aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
					Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class
					aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
				</p>
			{/each}
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Framework</h2>
			<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Visualization</h2>
			<a
				href="#visualization"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualization"
			></a>
		</ContentBox>
	</div>
	<div id="framework" class="section container mx-auto flex min-h-screen gap-4 px-4 pb-4 lg:gap-12">
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Case Studies</h2>
			<a href="#case-studies" class="pointer-event-none absolute inset-0" aria-label="Case Studies"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-san-marino-200 dark:bg-san-marino-800 min-h-screen grow px-12 py-8"
			noColor
			noMarginBottom
		>
			<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Framework</h2>
			<div
				class="terminal rounded-xl bg-slate-900 ring-1 ring-slate-800 mb-8 p-6 font-mono text-sm leading-relaxed text-slate-300 shadow-xl md:text-base"
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
				<div class="text-slate-500">
					Create ConversionTechnology photovoltaics
				</div>
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
			{#each Array(11) as _}
				<p>
					Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
					pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu
					aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
					Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class
					aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
				</p>
			{/each}
		</ContentBox>
		<ContentBox
			class="box relative hidden py-8 text-center md:block"
			noColor
			noShadow
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Visualization</h2>
			<a
				href="#visualization"
				class="pointer-event-none absolute inset-0"
				aria-label="Visualization"
			></a>
		</ContentBox>
	</div>
	<div
		id="visualization"
		class="section container mx-auto flex min-h-screen gap-4 px-4 pb-4 lg:gap-12"
	>
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Case Studies</h2>
			<a href="#case-studies" class="pointer-event-none absolute inset-0" aria-label="Case Studies"
			></a>
		</ContentBox>
		<ContentBox
			class="box bg-san-marino-200 dark:bg-san-marino-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Framework</h2>
			<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
		</ContentBox>
		<ContentBox
			class="box bg-teak-200 dark:bg-teak-800 min-h-screen grow px-12 py-8"
			noColor
			noMarginBottom
		>
			<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Visualization</h2>
			<div
				class="terminal rounded-xl bg-slate-900 ring-1 ring-slate-800 mb-8 p-6 font-mono text-sm leading-relaxed text-slate-300 shadow-xl md:text-base"
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
				<div class="text-slate-500">
					Create ConversionTechnology photovoltaics
				</div>
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
			{#each Array(9) as _}
				<p>
					Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
					pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu
					aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
					Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class
					aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
				</p>
			{/each}
		</ContentBox>
	</div>
	<!-- Shapes for the animation -->
	<div class="pointer-events-none fixed inset-0">
		<div class="container mx-auto flex h-full gap-4 px-4 lg:gap-12">
			<div class="shape bg-gray-100 py-4 dark:bg-gray-800">
				<ContentBox
					class="bg-pacifika-200 dark:bg-pacifika-800 h-full w-full py-8 text-center md:block"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Case Studies</div>
				</ContentBox>
			</div>
			<div class="shape bg-gray-100 py-4 dark:bg-gray-800">
				<ContentBox
					class="bg-san-marino-200 dark:bg-san-marino-800 hidden h-full w-full py-8 text-center md:block"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Framework</div>
				</ContentBox>
			</div>
			<div class="shape bg-gray-100 py-4 dark:bg-gray-800">
				<ContentBox
					class="bg-teak-200 dark:bg-teak-800 hidden h-full w-full py-8 text-center md:block"
					noColor
					noMarginBottom
				>
					<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Visualization</div>
				</ContentBox>
			</div>
		</div>
	</div>
</div>

<section class="mt-8 border-t bg-gray-50 py-8 text-center dark:bg-gray-900">
	{#each Array(24) as _}
		<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
			An example of animating elements based on scroll position using GSAP and Svelte.
		</p>
	{/each}
</section>
