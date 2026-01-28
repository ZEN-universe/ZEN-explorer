import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Action } from 'svelte/action';

export const animate: Action<HTMLElement, { topOffset?: number } | undefined> = (
	wrapper,
	properties
) => {
	const { topOffset } = properties ?? {};
	const top = topOffset ? `top+=${topOffset}px` : 'top top';

	gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);
	ScrollTrigger.defaults({ scrub: true });

	$effect(() => {
		const ctx = gsap.context((self) => {
			gsap.matchMedia().add('(min-width: 768px)', () => {
				const sections: HTMLElement[] = self.selector!('.section');
				const shapes: HTMLElement[] = self.selector!('.shape');

				const narrowShape = () => sections[0].querySelector('.box:nth-child(1)')!.clientWidth;
				const wideShape = () => sections[0].querySelector('.box:nth-child(2)')!.clientWidth;
				const vh = (factor: number) => factor * (window.innerHeight - (topOffset ?? 0));

				shapes.forEach((shape, i) => {
					// Initially align shapes with the first section boxes
					if (i !== 0) {
						gsap.from(shape, {
							y: () => vh(1),
							id: 'initial',
							ease: 'none',
							scrollTrigger: {
								trigger: sections[0],
								start: `top bottom`,
								end: `top ${top}`
							}
						});
					}

					// Finally move shapes out of view at the end of the last section
					if (i !== shapes.length - 1) {
						gsap.to(shape, {
							y: () => vh(-1),
							immediateRender: false,
							id: 'final',
							ease: 'none',
							scrollTrigger: {
								trigger: sections[sections.length - 1],
								start: `bottom bottom`,
								end: `bottom ${top}`
							}
						});
					}
				});

				sections.forEach((section, i) => {
					// Animate shape box styles when entering and leaving each section
					gsap.to(shapes, {
						marginTop: '0rem',
						scrollTrigger: {
							id: `top_${i + 1}`,
							trigger: section,
							start: `top ${top}`,
							end: '+=16'
						},
						ease: 'none'
					});

					gsap.to(shapes, {
						marginBottom: '1rem',
						borderRadius: '0rem 0rem 0.5rem 0.5rem',
						scrollTrigger: {
							id: `bottom_${i + 1}`,
							trigger: section,
							start: 'bottom-=16 bottom',
							end: '+=16'
						},
						ease: 'none'
					});

					// Transition between sections
					if (i === sections.length - 1) return;
					gsap
						.timeline({
							scrollTrigger: {
								id: `transition_${i + 1}->${i + 2}`,
								trigger: section,
								start: 'bottom bottom',
								end: () => `+=${vh(1)}`,
								pin: true,
								pinSpacing: false,
								snap: {
									snapTo: [0, 1],
									duration: { min: 0, max: 1.0 },
									delay: 0,
									ease: 'power1.inOut'
								}
							}
						})
						// hide content of current section and show shape boxes (1 timestep)
						.set(sections[i + 1], { opacity: 0 }, 0)
						.to(shapes[i], { opacity: 1, duration: 1, ease: 'none' }, 0)
						.set(section, { opacity: 0 }, 1)
						// animate the shapes to the next section's box sizes and positions (3 timesteps)
						.to(shapes[i], { width: wideShape, duration: 3 }, 1)
						.to(shapes[i + 1], { width: narrowShape, duration: 3 }, 1)
						.to(
							shapes,
							{
								borderRadius: '0.5rem 0.5rem 0rem 0rem',
								marginTop: '1rem',
								marginBottom: '0rem',
								duration: 3
							},
							1
						)
						// move the next section's box into view (1 timestep)
						.set(sections[i + 1], { opacity: 1 }, 4)
						.fromTo(
							sections[i + 1].querySelector(`.box:nth-child(${i + 2})`),
							{ y: () => vh(-0.2) },
							{ y: 0, duration: 1, ease: 'none' },
							4
						)
						.to(shapes[i + 1], { opacity: 0, duration: 1, ease: 'none' }, 4);
				});
			});
		}, wrapper); // scope selector to wrapper

		return () => ctx.revert(); // cleanup on destroy or parameter change
	});
};
