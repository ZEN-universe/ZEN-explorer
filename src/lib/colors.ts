// ETH colour palette
// Source: https://ethz.ch/staffnet/en/service/communication/corporate-design/colours.html
const colors: string[][] = [
	[
		// Blue
		'rgb(122, 157, 207)', // 60%
		'rgb(8, 64, 126)', // 120%
		'rgb(166, 190, 223)', // 40%
		'rgb(33, 92, 175)', // 100%
		'rgb(211, 222, 239)', // 20%
		'rgb(77, 125, 191)' // 80%
	],
	[
		// Red
		'rgb(212, 134, 129)',
		'rgb(150, 39, 45)',
		'rgb(226, 174, 171)',
		'rgb(183, 53, 45)',
		'rgb(241, 215, 213)',
		'rgb(197, 93, 87)'
	],
	[
		// Petrol
		'rgb(102, 175, 192)',
		'rgb(0, 89, 109)',
		'rgb(153, 202, 213)',
		'rgb(0, 120, 148)',
		'rgb(204, 228, 234)',
		'rgb(51, 149, 171)'
	],
	[
		// Purpure
		'rgb(202, 108, 174)',
		'rgb(140, 10, 89)',
		'rgb(220, 158, 201)',
		'rgb(167, 17, 122)',
		'rgb(239, 208, 227)',
		'rgb(183, 59, 146)'
	],
	[
		// Green
		'rgb(161, 171, 113)',
		'rgb(54, 82, 19)',
		'rgb(192, 199, 161)',
		'rgb(98, 115, 19)',
		'rgb(224, 227, 208)',
		'rgb(129, 143, 66)'
	],
	// [
	// 	// Gray
	// 	'rgb(169, 169, 169)',
	// 	'rgb(87, 87, 87)',
	// 	'rgb(197, 197, 197)',
	// 	'rgb(111, 111, 111)',
	// 	'rgb(226, 226, 226)',
	// 	'rgb(140, 140, 140)'
	// ],
	[
		// Bronze
		'rgb(187, 164, 113)',
		'rgb(112, 79, 18)',
		'rgb(210, 194, 161)',
		'rgb(142, 103, 19)',
		'rgb(232, 225, 208)',
		'rgb(165, 133, 66)'
	]
];

let colorIndex = 0;
let shadeIndex = 0;

let colorMap: Record<string, string> = {};

/**
 * Resets the color state to the initial state.
 * This is useful when you want to start over with color selection.
 */
export function resetColorState() {
	colorIndex = 0;
	shadeIndex = 0;
	colorMap = {};
}

/**
 * Pick the next color from the ETH color palette. Assigns the same color to the same label if provided.
 * @param label Optional label to consistently assign the same color to the same label.
 * @returns Color string in the format "rgb(r, g, b)".
 * May return duplicates if called more than 49 times without resetting.
 */
export function nextColor(label?: string): string {
	// Return a previously assigned color if label is provided and already exists
	if (label !== undefined && colorMap[label] !== undefined) {
		return colorMap[label];
	}

	// Cycle through colors and shades
	if (colorIndex >= colors.length) {
		colorIndex = 0; // Reset to the first color
		shadeIndex++;
		if (shadeIndex >= colors[0].length) {
			shadeIndex = 0; // Reset to the first shade
		}
	}

	// Assign color
	const color = colors[colorIndex][shadeIndex];
	colorIndex++;

	// Store in map if label is provided
	if (label !== undefined) {
		colorMap[label] = color;
	}

	return color;
}

/**
 * Adds a transparency value to a given color string in the format "rgb(r, g, b)".
 * @param color color string in the format "rgb(r, g, b)"
 * @param transparency transparency value between 0 and 1 (default is 0.8)
 */
export function addTransparency(color: string, transparency: number = 0.8): string {
	return color.replace('rgb', 'rgba').replace(')', `, ${transparency})`);
}

export function allColors(): string[] {
	const flatColors = [];
	for (let j = 0; j < colors.length; j++) {
		for (let i = 0; i < colors[0].length; i++) {
			flatColors.push(colors[i][j]);
		}
	}
	return flatColors;
}
