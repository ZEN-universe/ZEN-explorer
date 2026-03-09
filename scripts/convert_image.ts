#!/usr/bin/env node

import { accessSync } from 'node:fs';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

const widths = [1344, 1088, 864, 672, 576];

function printUsage(scriptName: string): void {
	console.error(`Usage: ${scriptName} input_image`);
}

function getConvertCommand(): string {
	const magickCheck = spawnSync('magick', ['-version'], { stdio: 'ignore' });
	if (magickCheck.status === 0) {
		return 'magick';
	}

	const convertCheck = spawnSync('convert', ['-version'], { stdio: 'ignore' });
	if (convertCheck.status === 0) {
		return 'convert';
	}

	console.error('ImageMagick executable not found. Install `magick` or `convert` and retry.');
	process.exit(1);
}

function runOrExit(command: string, args: string[]): void {
	const result = spawnSync(command, args, { stdio: 'inherit' });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const inputImage = process.argv[2];
const scriptName = path.basename(process.argv[1] ?? 'convert_image.ts');

if (!inputImage) {
	printUsage(scriptName);
	process.exit(1);
}

try {
	accessSync(inputImage, constants.R_OK);
} catch {
	console.error(`Input image not found or not readable: ${inputImage}`);
	process.exit(1);
}

const convertCommand = getConvertCommand();
const inputBaseName = inputImage.replace(/\.[^.]+$/, '');

console.log(`Converting ${inputImage} to multiple widths and formats...`);

for (const w of widths) {
	console.log(`Processing width: ${w}px`);

	const optimizedGif = `${inputBaseName}_${w}.gif`;
	console.log(`Converting to ${optimizedGif}`);
	runOrExit(convertCommand, [inputImage, '-coalesce', '-resize', `${w}x`, '-layers', 'optimize', optimizedGif]);

	const optimizedWebp = `${inputBaseName}_${w}.webp`;
	console.log(`Converting to ${optimizedWebp}`);
	runOrExit(convertCommand, [optimizedGif, '-coalesce', '-quality', '80', '-loop', '0', optimizedWebp]);
}
