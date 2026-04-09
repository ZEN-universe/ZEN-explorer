import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// const widths = [1344, 1088, 864, 672, 576];
// const images = ['static/evolution_map_final.gif', 'static/evolution_map_final_dark.gif'];
const images: Record<string, { widths: number[] }> = {
	'static/evolution_map_final.gif': {
		widths: [1344, 1088, 864, 672, 576]
	},
	'static/evolution_map_final_dark.gif': {
		widths: [1344, 1088, 864, 672, 576]
	}
};

const videos: Record<string, { widths: number[] }> = {
	'static/build_your_model.mp4': {
		widths: [1184, 928, 672, 512, 576]
	},
	'static/build_your_model_dark.mp4': {
		widths: [1184, 928, 672, 512, 576]
	}
};

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

function convertVideo(inputVideo: string, width: number): void {
	// Generate optimized MP4
	const mp4Path = `${inputVideo.replace(/\.[^.]+$/, '')}_${width}.mp4`;

	if (existsSync(mp4Path)) {
		return;
	}

	// Run command: ffmpeg -i inputVideo.mp4 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 128k outputVideo.mp4
	const ffmpegResult = spawnSync(
		'ffmpeg',
		[
			'-i',
			inputVideo,
			'-vf',
			'scale=trunc(iw/2)*2:trunc(ih/2)*2',
			'-c:v',
			'libx264',
			'-preset',
			'medium',
			'-crf',
			'23',
			'-pix_fmt',
			'yuv420p',
			'-movflags',
			'+faststart',
			'-colorspace',
			'bt709',
			'-color_primaries',
			'bt709',
			'-color_trc',
			'bt709',
			'-color_range',
			'tv',
			'-c:a',
			'aac',
			'-b:a',
			'128k',
			mp4Path
		],
		{ stdio: 'inherit' }
	);

	if (ffmpegResult.status !== 0) {
		throw new Error(`Failed to convert ${inputVideo} to MP4 at width ${width}px`);
	}
}

function responsiveImagePlugin() {
	return {
		name: 'responsive-image-plugin',
		configResolved() {
			Object.entries(images).forEach(([image, { widths }]) =>
				widths.forEach((w) => convertImage(image, w))
			);
			Object.entries(videos).forEach(([video, { widths }]) =>
				widths.forEach((w) => convertVideo(video, w))
			);
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), responsiveImagePlugin()]
});
