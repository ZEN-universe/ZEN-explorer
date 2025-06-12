const defaultColors: string[] = [
	'rgb(75, 192, 192)',
	'rgb(54, 162, 235)',
	'rgb(255, 206, 86)',
	'rgb(153, 102, 255)',
	'rgb(255, 159, 64)',
	'rgb(255, 99, 132)',
	'rgb(201, 203, 207)',
	'rgb(220,20,60)',
	'rgb(255,99,71)',
	'rgb(255,69,0)',
	'rgb(154,205,50)',
	'rgb(0,100,0)',
	'rgb(50,205,50)',
	'rgb(0,139,139)',
	'rgb(153,50,204)',
	'rgb(255,105,180)'
];

let current_index = 0;

export function reset_color_state() {
	current_index = 0;
}

export function next_color(): string {
	if (current_index >= defaultColors.length) {
		current_index = 0; // Reset to the first color if we exceed the array length
	}

	const color = defaultColors[current_index];
	current_index++;

	return color;
}
