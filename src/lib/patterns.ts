import { draw } from 'patternomaly';

export type ShapeType = Parameters<typeof draw>[0];

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

let patternIndex = 0;

export function resetPatternState() {
	patternIndex = 0;
}

export function nextPattern(): ShapeType {
	let pattern = patterns[patternIndex];
	patternIndex = (patternIndex + 1) % patterns.length;
	return pattern;
}
