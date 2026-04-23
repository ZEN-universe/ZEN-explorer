import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import TextPlugin from 'gsap/TextPlugin';
import type { Action } from 'svelte/action';
import { debounce } from './debounce';

export const animate: Action<HTMLElement, { topOffset?: number } | undefined> = (
	wrapper,
	properties
) => {
	let { topOffset } = properties ?? {};
	topOffset = topOffset ?? 0;

	gsap.registerPlugin(ScrollTrigger, TextPlugin);

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
				terminalAnimation(sections, topOffset);
				finalBlockAnimation(sections, shapes, topOffset, vh);
			});
		}, wrapper); // scope selector to wrapper

		onImageLoaded().then(() => refreshAll()); // refresh ScrollTrigger after all images have loaded to ensure correct positions
		const debouncedRefresh = debounce(refreshAll, 100);
		window.addEventListener('resize', debouncedRefresh); // refresh ScrollTrigger on resize to recalculate positions

		return () => {
			ctx.revert(); // cleanup on destroy or parameter change
			window.removeEventListener('resize', debouncedRefresh);
		};
	});
};

function onImageLoaded(): Promise<void[]> {
	return Promise.all(
		Array.from(document.images).map((img) => {
			if (img.complete) return Promise.resolve();
			return new Promise<void>((resolve) => {
				img.addEventListener('load', () => resolve());
				img.addEventListener('error', () => resolve());
			});
		})
	);
}

export function refreshAll() {
	ScrollTrigger.getAll().forEach((trigger) => trigger.refresh());
}

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
			preventOverlaps: true,
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
	// const terminalTls: Record<number, gsap.core.Timeline> = {};
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
				preventOverlaps: true,
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
		tl.set(sections[i + 1], { autoAlpha: 0 }, 0);
		tl.to(sections[i], { y: () => vh(-0.4), ease: 'none', duration: 2 }, 0);

		// hide content of current section and show shape boxes (1 timestep)
		tl.to(shapes, { autoAlpha: 1, duration: 1, ease: 'none' }, 1);

		// animate the shapes to the next section's box sizes and positions (3 timesteps)
		tl.set(section, { autoAlpha: 0 }, '<1');
		tl.to(shapes[i], { width: narrowWidth, duration: 3 }, '<');
		tl.to(shapes[i + 1], { width: wideWidth, duration: 3 }, '<');

		// move the next section's box into view (1 timestep)
		tl.set(sections[i + 1], { autoAlpha: 1 }, '<3');
		tl.to(shapes[i + 1], { autoAlpha: 0, duration: 1, ease: 'none' }, '<');
	});
}

async function terminalAnimation(sections: HTMLElement[], topOffset: number) {
	await document.fonts.ready; // ensure fonts are loaded before measuring text for SplitText
	sections.forEach((section) => {
		const terminal = section.querySelector('.terminal');
		if (!terminal) return;

		const tl = gsap.timeline({
			scrollTrigger: {
				immediateRender: false,
				id: 'terminal',
				trigger: section,
				start: `top ${topOffset + 16.1}`,
				end: `bottom bottom`,
				toggleActions: 'play complete none restart',
				preventOverlaps: true
			}
		});

		let longDelay = false;
		(terminal.childNodes ?? []).forEach((child) => {
			if (!(child instanceof HTMLElement)) return;
			const animateChars = Object.prototype.hasOwnProperty.call(
				(child as HTMLElement).dataset,
				'animateChars'
			);
			let trigger: HTMLElement | Element[] = child;
			if (animateChars) {
				trigger = new SplitText(child, { type: 'chars' }).chars;
			}
			tl.from(
				trigger,
				{
					visibility: 'hidden',
					stagger: 0.05,
					ease: 'none',
					duration: animateChars ? 0.01 : 0.1
				},
				longDelay ? '+=1.5' : '+=0.5'
			);
			longDelay = child.textContent == '...';
		});
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
			preventOverlaps: true,
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
