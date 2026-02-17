import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Action } from 'svelte/action';

export const animate: Action<HTMLElement, { topOffset?: number } | undefined> = (
	wrapper,
	properties
) => {
	let { topOffset } = properties ?? {};
	topOffset = topOffset ?? 0;

	gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

	$effect(() => {
		const ctx = gsap.context((self) => {
			gsap.matchMedia().add('(min-width: 768px)', () => {
				const sections: HTMLElement[] = self.selector!('.section');
				const shapes: HTMLElement[] = self.selector!('.shape');
				const headSection = self.selector!('#head-section')[0];
				const headSectionBoxes = self.selector!('#head-section .box');

				const wideWidth = () => sections[0].querySelector('.box:nth-child(1)')!.clientWidth;
				const narrowWidth = () => sections[0].querySelector('.box:nth-child(2)')!.clientWidth;
				const vh = (factor: number) => factor * (window.innerHeight - topOffset);

				headSectionAnimation(headSection, headSectionBoxes, shapes, sections, topOffset, vh);
				transitionAnimation(sections, shapes, vh, narrowWidth, wideWidth);
				finalBlockAnimation(sections, shapes, topOffset, vh);
			});
		}, wrapper); // scope selector to wrapper

		return () => ctx.revert(); // cleanup on destroy or parameter change
	});
};

function headSectionAnimation(
	headSection: HTMLElement,
	headSectionBoxes: HTMLElement[],
	shapes: HTMLElement[],
	sections: HTMLElement[],
	topOffset: number,
	vh: (factor: number) => number
) {
	const firstBoxes = sections[0].querySelectorAll('.box');

	const tl = gsap.timeline({
		scrollTrigger: {
			id: 'head-section',
			trigger: headSection,
			start: `top 20%`,
			end: () => `bottom ${topOffset + 16}`,
			scrub: 0.3,
			pin: true,
			pinSpacing: false,
			snap: {
				snapTo: [0, 1],
				directional: false,
				duration: { min: 0, max: 1.0 },
				delay: 0,
				ease: 'power1.inOut'
			}
		}
	});

	// show all shapes on top of the header boxes (1 timestep)
	tl.addLabel('start', 0);
	tl.set(shapes, { autoAlpha: 0, y: () => headSectionBoxes[0].getBoundingClientRect().top }, 0);
	tl.to(shapes, { autoAlpha: 1, duration: 1, ease: 'none' }, 0);

	// animate the shapes to the first section's box sizes and positions (3 timesteps)
	tl.addLabel('transition', 1);
	tl.set(headSection, { autoAlpha: 0 }, 1);
	shapes.forEach((shape, idx) => {
		tl.fromTo(
			shape,
			{
				y: () => headSectionBoxes[0].getBoundingClientRect().top,
				height: () => headSectionBoxes[idx].clientHeight + 32,
				marginTop: '-1rem',
				width: () => headSectionBoxes[idx].clientWidth
			},
			{
				y: 0,
				height: () => vh(1),
				marginTop: `${topOffset}px`,
				width: () => firstBoxes[idx].clientWidth,
				ease: 'none',
				duration: 3
			},
			1
		);
	});
	tl.addLabel('reveal', 4);
	tl.to(shapes[0], { autoAlpha: 0, duration: 1, ease: 'none' }, 4);
	tl.from(sections[0], { autoAlpha: 0, duration: 1, ease: 'none' }, 4);
}

function transitionAnimation(
	sections: HTMLElement[],
	shapes: HTMLElement[],
	vh: (factor: number) => number,
	narrowWidth: () => number,
	wideWidth: () => number
) {
	sections.forEach((section, i) => {
		// Transition between sections
		if (i === sections.length - 1) return;
		const tl = gsap.timeline({
			scrollTrigger: {
				id: `transition_${i + 1}->${i + 2}`,
				trigger: section,
				start: 'bottom bottom',
				end: () => `+=${vh(1.0) - 16}`,
				scrub: 0.3,
				pin: true,
				pinSpacing: false,
				snap: {
					snapTo: [0, 1],
					directional: false,
					duration: { min: 0, max: 1.0 },
					delay: 0.2,
					ease: 'power1.inOut'
				}
			}
		});

		// move current section up and next section's box into view (1 timestep)
		tl.addLabel('start', 0);
		tl.to(sections[i], { y: () => vh(-0.2), ease: 'none', duration: 1 }, 0);
		tl.set(sections[i + 1], { autoAlpha: 0 }, 0);

		// hide content of current section and show shape boxes (1 timestep)
		tl.addLabel('hide', 1);
		tl.fromTo(shapes[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: 'none' }, 1);

		// animate the shapes to the next section's box sizes and positions (3 timesteps)
		tl.addLabel('transition', 2);
		tl.set(section, { autoAlpha: 0 }, 2);
		tl.to(shapes[i], { width: narrowWidth, duration: 3 }, 2);
		tl.to(shapes[i + 1], { width: wideWidth, duration: 3 }, 2);

		// move the next section's box into view (1 timestep)
		tl.addLabel('reveal', 5);
		tl.set(sections[i + 1], { autoAlpha: 1 }, 5);
		tl.to(shapes[i + 1], { autoAlpha: 0, duration: 1, ease: 'none' }, 5);
	});
}

function finalBlockAnimation(
	sections: HTMLElement[],
	shapes: HTMLElement[],
	topOffset: number,
	vh: (factor: number) => number
) {
	const tl = gsap.timeline({
		scrollTrigger: {
			id: 'final',
			trigger: sections[sections.length - 1],
			start: `bottom bottom`,
			end: `bottom top+=${topOffset}px`,
			scrub: true
		}
	});
	shapes.forEach((shape, i) => {
		if (i === shapes.length - 1) return;
		tl.to(
			shape,
			{
				y: () => vh(-1.0),
				ease: 'none'
			},
			0
		);
	});
}
