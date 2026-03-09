import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const widths = [1344, 1088, 864, 672, 576];
const images = ['static/evolution_map_final.gif', 'static/evolution_map_final_dark.gif'];

function convertImage(inputImage: string, width: number): void {
	// Generate optimized GIF
	const gifPath = `${inputImage.replace(/\.[^.]+$/, '')}_${width}.gif`;
	const webpPath = `${inputImage.replace(/\.[^.]+$/, '')}_${width}.webp`;

	// If the optimized files already exist, skip conversion
	if (existsSync(gifPath) && existsSync(webpPath)) {
		return;
	}

	// Use ImageMagick to convert and optimize the GIF
	const convertResult = spawnSync(
		'convert',
		[inputImage, '-coalesce', '-resize', `${width}x`, '-layers', 'optimize', gifPath],
		{ stdio: 'inherit' }
	);
	if (convertResult.status !== 0) {
		throw new Error(`Failed to convert ${inputImage} to GIF at width ${width}px`);
	}

	// Convert to WebP
	const webpResult = spawnSync(
		'convert',
		[gifPath, '-coalesce', '-quality', '80', '-loop', '0', webpPath],
		{ stdio: 'inherit' }
	);
	if (webpResult.status !== 0) {
		throw new Error(`Failed to convert ${inputImage} to WebP at width ${width}px`);
	}
}

function responsiveImagePlugin() {
	return {
		name: 'responsive-image-plugin',
		configResolved() {
			images.forEach((image) => widths.forEach((w) => convertImage(image, w)));
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), responsiveImagePlugin()]
});
