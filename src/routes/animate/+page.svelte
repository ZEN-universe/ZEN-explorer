<script lang="ts">
	import '@/app.css';

	// import { gsap } from 'gsap';
	// import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
	// import { ScrollTrigger } from 'gsap/ScrollTrigger';

	import ContentBox from '$components/ContentBox.svelte';
	// import { onMount } from 'svelte';
	import { animate } from '@/lib/frontPageAnimation.svelte';

	// let wrapper: HTMLElement;

	// gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);
	// ScrollTrigger.defaults({ markers: false, scrub: true });

	// onMount(() => {
	// 	const ctx = gsap.context((self) => {
	//         const sections: HTMLElement[] = self.selector!('.section');
	//         const shapes: HTMLElement[] = self.selector!('.shape');

	//         sections.forEach((_, i) => {
	//             const section = wrapper.querySelector(`.section:nth-child(${i+1})`)!;
	//             gsap.to(shapes, { marginTop: '0rem', scrollTrigger: {
	//                 id: `top_${i+1}`,
	//                 trigger: section,
	//                 start: 'top top',
	//                 end: '+=16',
	//                 // markers: {
	//                 //     startColor: 'pink',
	//                 //     endColor: 'pink',
	//                 // }
	//             }, ease: "none" });

	//             gsap.to(shapes, { marginBottom: '1rem', borderRadius: '0rem 0rem 0.5rem 0.5rem', scrollTrigger: {
	//                 id: `bottom_${i+1}`,
	//                 trigger: section,
	//                 start: 'bottom-=16 bottom',
	//                 end: '+=16',
	//                 // markers: {
	//                 //     startColor: 'darkgreen',
	//                 //     endColor: 'darkgreen',
	//                 // }
	//             }, ease: "none" });

	//             if (i === sections.length - 1) return;

	//             gsap
	//                 .timeline({
	//                     scrollTrigger: {
	//                         id: `transition_${i+1}->${i+2}`,
	//                         trigger: section,
	//                         start: 'bottom bottom',
	//                         end: () => `+=${1*window.innerHeight}`,
	//                         pin: true,
	//                         pinSpacing: false,
	//                         // markers: {
	//                         //     startColor: 'orange',
	//                         //     endColor: 'orange',
	//                         // },
	//                         snap: {
	//                             snapTo: [0, 1],
	//                             duration: { min: 0, max: 1.0 },
	//                             delay: 0,
	//                             ease: "power1.inOut",
	//                         },
	//                     }
	//                 })
	//                 .set(sections[i+1], { opacity: 0 }, 0)
	//                 .to(shapes[i], { opacity: 1, duration: 1, ease: "none" }, 0)
	//                 .set(section, { opacity: 0 }, 1)
	//                 .to(shapes[i], {
	//                     width: () => section.querySelector(`.box:nth-child(${i+2})`)!.clientWidth,
	//                     duration: 3
	//                 }, 1)
	//                 .to(shapes[i+1], {
	//                     width: () => section.querySelector(`.box:nth-child(${i+1})`)!.clientWidth,
	//                     duration: 3
	//                 }, 1)
	//                 .to(shapes, {
	//                     borderRadius: '0.5rem 0.5rem 0rem 0rem',
	//                     marginTop: '1rem',
	//                     marginBottom: '0rem',
	//                     duration: 3
	//                 }, 1)
	//                 .set(sections[i+1], { opacity: 1 }, 4)
	//                 .fromTo(sections[i+1].querySelector(`.box:nth-child(${i+2})`), { y: `-20vh` }, { y: 0, duration: 1, ease: "none" }, 4)
	//                 .to(shapes[i+1], { opacity: 0, duration: 1, ease: "none" }, 4)
	//         });
	// 	}, wrapper);

	// 	return () => ctx.revert();
	// });
</script>

<!-- eslint-disable -->
<section class="my-8 text-center">
	<h1 class="mb-4 text-5xl font-bold sm:text-6xl lg:text-7xl">Animate on Scroll</h1>
	{#each Array(4) as _}
		<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
			An example of animating elements based on scroll position using GSAP and Svelte.
		</p>
	{/each}
</section>

<div class="relative" use:animate>
	<div id="case-studies" class="section container mx-auto flex gap-4 px-4 pt-4 pb-4 lg:gap-12">
		<ContentBox
			class="box bg-pacifika-200 dark:bg-pacifika-800 min-h-screen grow px-12 py-8"
			noColor
			noPadding
			noMarginBottom
		>
			<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Case Studies</h2>
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
			class="box bg-san-marino-200 dark:bg-san-marino-800 relative hidden py-8 text-center md:block"
			noColor
			noMarginBottom
		>
			<h2 class="mb-4 text-2xl font-bold opacity-0 [writing-mode:sideways-rl]">Framework</h2>
			<a href="#framework" class="pointer-event-none absolute inset-0" aria-label="Framework"></a>
		</ContentBox>
		<ContentBox
			class="box bg-teak-200 dark:bg-teak-800 relative hidden py-8 text-center md:block"
			noColor
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
		id="framework"
		class="section container mx-auto flex min-h-screen gap-4 px-4 pt-4 pb-4 lg:gap-12"
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
			class="box bg-san-marino-200 dark:bg-san-marino-800 min-h-screen grow px-12 py-8"
			noColor
			noMarginBottom
		>
			<h2 class="mb-8 text-4xl font-bold sm:text-5xl lg:text-6xl">Framework</h2>
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
			class="box bg-teak-200 dark:bg-teak-800 relative hidden py-8 text-center md:block"
			noColor
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
		class="section container mx-auto flex min-h-screen gap-4 px-4 pt-4 pb-4 lg:gap-12"
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
			<ContentBox
				class="shape bg-pacifika-200 dark:bg-pacifika-800 mt-4 hidden w-full py-8 text-center opacity-0 md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Case Studies</div>
			</ContentBox>
			<ContentBox
				class="shape bg-san-marino-200 dark:bg-san-marino-800 mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Framework</div>
			</ContentBox>
			<ContentBox
				class="shape bg-teak-200 dark:bg-teak-800 mt-4 hidden py-8 text-center md:block"
				noColor
				noMarginBottom
			>
				<div class="mb-4 text-2xl font-bold [writing-mode:sideways-rl]">Visualization</div>
			</ContentBox>
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
