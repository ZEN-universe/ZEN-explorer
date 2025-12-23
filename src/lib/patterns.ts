import type { ColorBoxItem } from '$components/ColorBox.svelte';
import { draw } from 'patternomaly';

export type ShapeType = Parameters<typeof draw>[0];

/**
 * List of available patterns from patternomaly
 * Used to cycle through patterns for visual representation.
 */
const patterns: ShapeType[] = [
	'diagonal',
	'diagonal-right-left',
	'dot',
	'diamond',
	'dot-dash',
	'zigzag',
	'zigzag-vertical',
	'line',
	'line-vertical',
	'plus',
	'cross',
	'dash',
	'cross-dash',
	'disc',
	'ring',
	'weave',
	'square',
	'box',
	'triangle',
	'triangle-inverted',
	'diamond-box'
];

/**
 * Index to keep track of the current pattern in the cycle.
 */
let patternIndex = 0;

/**
 * Resets the pattern index to start from the beginning of the pattern list.
 */
export function resetPatternState() {
	patternIndex = 0;
}

/**
 * Returns the next pattern in the cycle.
 * @returns Pattern as type ShapeType
 */
export function nextPattern(): ShapeType {
	const pattern = patterns[patternIndex];
	patternIndex = (patternIndex + 1) % patterns.length;
	return pattern;
}

/**
 * Creates a ColorBoxItem with the specified text and optional pattern.
 * @param text Text to display in the ColorBoxItem
 * @param pattern Optional pattern to use for the fill style
 * @returns ColorBoxItem object
 */
export function createColorBoxItem(text: string, pattern?: ShapeType): ColorBoxItem {
	return {
		text: text,
		fillStyle: pattern !== undefined ? draw(pattern, '#aaa') : '#aaa'
	};
}
