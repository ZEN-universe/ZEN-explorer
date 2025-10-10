import { draw } from 'patternomaly';

export type ShapeType = Parameters<typeof draw>[0];

const patterns: ShapeType[] = [
	'plus',
	'cross',
	'dash',
	'cross-dash',
	'dot',
	'dot-dash',
	'disc',
	'ring',
	'line',
	'line-vertical',
	'weave',
	'zigzag',
	'zigzag-vertical',
	'diagonal',
	'diagonal-right-left',
	'square',
	'box',
	'triangle',
	'triangle-inverted',
	'diamond',
	'diamond-box'
];

let patternIndex = 0;

export function resetPatternState() {
	patternIndex = 0;
}

export function nextPattern(): ShapeType {
	patternIndex = (patternIndex + 1) % patterns.length;
	return patterns[patternIndex];
}
