import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FOLDER = 'static';
const BUILD_FOLDER = 'static/opt';

const images: Record<string, { widths: number[] }> = {
	'evolution_map_final.gif': {
		widths: [1344, 1088, 864, 672, 576]
	},
	'evolution_map_final_dark.gif': {
		widths: [1344, 1088, 864, 672, 576]
	},
	'explorer-front.png': {
		widths: [544, 448, 576, 832, 1088]
	}
};

const videos: Record<string, { widths: number[] }> = {
	'build_your_model.mp4': {
		widths: [1184, 928, 672, 512, 576]
	},
	'build_your_model_dark.mp4': {
		widths: [1184, 928, 672, 512, 576]
	}
};

function convertImage(inputImage: string, width: number): void {
	const inputPath = `${FOLDER}/${inputImage}`;
	const extension = inputImage.split('.').pop()?.toLowerCase();
	const outputPath = `${BUILD_FOLDER}/${inputImage.replace(/\.[^.]+$/, '')}_${width}.${extension}`;
	const webpPath = `${BUILD_FOLDER}/${inputImage.replace(/\.[^.]+$/, '')}_${width}.webp`;

	// If the optimized files already exist, skip conversion
	if (existsSync(outputPath) && existsSync(webpPath)) {
		return;
	}

	// Use ImageMagick to convert and optimize the image
	const convertResult = spawnSync(
		'convert',
		[inputPath, '-coalesce', '-resize', `${width}x`, '-layers', 'optimize', outputPath],
		{ stdio: 'inherit' }
	);
	if (convertResult.status !== 0) {
		throw new Error(
			`Failed to convert ${inputPath} to GIF at width ${width}px.\nStatus: ${convertResult.status}\n${convertResult.stderr.toString()}`
		);
	}

	// Convert to WebP
	const webpResult = spawnSync(
		'convert',
		[outputPath, '-coalesce', '-quality', '80', '-loop', '0', webpPath],
		{ stdio: 'inherit' }
	);
	if (webpResult.status !== 0) {
		throw new Error(
			`Failed to convert ${inputPath} to WebP at width ${width}px.\nStatus: ${convertResult.status}\n${convertResult.stderr.toString()}`
		);
	}
}

function convertVideo(inputVideo: string, width: number): void {
	const videoPath = `${FOLDER}/${inputVideo}`;
	const mp4Path = `${BUILD_FOLDER}/${inputVideo.replace(/\.[^.]+$/, '')}_${width}.mp4`;

	if (existsSync(mp4Path)) {
		return;
	}

	// Run command: ffmpeg -i inputVideo.mp4 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 128k outputVideo.mp4
	const ffmpegResult = spawnSync(
		'ffmpeg',
		[
			'-i',
			videoPath,
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
		throw new Error(
			`Failed to convert ${inputVideo} to MP4 at width ${width}px.\nStatus: ${ffmpegResult.status}\n${ffmpegResult.stderr.toString()}`
		);
	}
}

function responsiveImagePlugin() {
	return {
		name: 'responsive-image-plugin',
		configResolved() {
			mkdirSync(BUILD_FOLDER, { recursive: true });
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
