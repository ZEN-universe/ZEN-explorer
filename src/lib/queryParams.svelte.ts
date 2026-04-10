import { replaceState as svelteReplaceState, afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import type { Pathname } from '$app/types';

/* eslint-disable svelte/prefer-svelte-reactivity */

export type URLParams = Record<string, string | null>;

export const QUERY_PARAM_KEYS = {
	solution: 'solution',
	solutions: 'solutions',
	scenario: 'scenario',
	scenarios: 'scenarios',
	carrier: 'carrier',
	carriers: 'carriers',
	capacityVariable: 'variable',
	technologyType: 'technologyType',
	storageType: 'storageType',
	energyType: 'energyType',
	conversionTechnologies: 'conv_tech',
	storageTechnologies: 'sto_tech',
	transportTechnologies: 'transp_tech',
	year: 'year',
	node: 'node',
	nodes: 'nodes',
	smoothing_window_size: 'window',
	activeYear: 'active_year',
	activeSolution: 'active_solution'
};

let urlParams: URLParams = $state({});

function getRawURLParam(key: string): string | null {
	const state = page.state as Record<string, string>;
	return state[key] ?? urlParams[key] ?? null;
}

export function getURLParam(key: string): string | null {
	const value = getRawURLParam(key);
	return value ? decodeURIComponent(value) : null;
}

export function getURLParamAsArray(key: string): string[] {
	const param = getRawURLParam(key);
	if (!param) return [];
	return param.split('~').map((i) => decodeURIComponent(i));
}

export function getURLParamAsIntArray(key: string): number[] | null {
	const param = getRawURLParam(key);
	if (param === null) return null;
	return param
		.split('~')
		.map((i) => parseInt(i))
		.filter((i) => !isNaN(i));
}

export function getURLParamAsBoolean(key: string, defaultValue: boolean): boolean {
	const param = getURLParam(key);
	if (param === null) return defaultValue;
	return param === '1' || param === 'true';
}

export function encodeValueForURL(positions: number[], capacity: number): string {
	if (positions.length === 0) return '';

	// Encode selected option positions into a variable-length bitset.
	const bytes = new Uint8Array(Math.ceil(capacity / 8));
	for (const pos of positions) {
		if (pos < 0) continue;
		const byteIndex = Math.floor(pos / 8);
		const bitIndex = pos % 8;
		bytes[byteIndex] |= 1 << bitIndex;
	}

	// Convert bytes to base64 string
	const binary = String.fromCharCode(...bytes);
	return `${capacity},${btoa(binary)}`;
}

export function decodeValueFromURL(urlValue: string, capacity: number): number[] | null {
	if (!urlValue) return null;

	const [decodedCapacity, base64] = urlValue.split(',', 2);
	if (parseInt(decodedCapacity) !== capacity) {
		console.warn(
			`Capacity mismatch when decoding URL parameter. Expected ${capacity}, got ${decodedCapacity}`
		);
		return null;
	}

	try {
		// Convert base64 string back to bytes
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}

		// Decode selected option positions from the bitset.
		const decoded: number[] = [];
		for (let i = 0; i < capacity; i++) {
			const byteIndex = Math.floor(i / 8);
			const bitIndex = i % 8;
			if ((bytes[byteIndex] & (1 << bitIndex)) !== 0) {
				decoded.push(i);
			}
		}

		return decoded;
	} catch {
		console.warn(`Could not decode Base64 from URL: ${urlValue}`);
		return null;
	}
}

function buildURL(params: URLParams, base_url?: string): URL {
	if (!base_url) {
		base_url = window.location.href;
	}

	const url = new URL(base_url, window.location.origin);
	for (const key in params) {
		if (params[key] !== null) {
			url.searchParams.set(key, params[key]);
		} else {
			url.searchParams.delete(key);
		}
	}
	return url;
}

export function addCurrentSolutionToURL(
	url?: Pathname,
	hasMultipleSolutions: boolean = false
): string {
	const params: URLParams = {};
	const singleSolution = getURLParam('solution');
	const singleScenario = getURLParam('scenario');
	const multipleSolutions = getURLParamAsArray('solutions');
	const multipleScenarios = getURLParamAsArray('scenarios');

	if (hasMultipleSolutions) {
		params['solutions'] = multipleSolutions.join('~') || singleSolution || '';
		params['scenarios'] =
			multipleScenarios.join('~') || singleScenario || (singleSolution ? 'none' : '');
	} else {
		params['solution'] = singleSolution || multipleSolutions[0] || '';
		params['scenario'] = singleScenario || multipleScenarios[0] || '';
	}

	return buildURL(params, url).href;
}

export function addParametersToPath(
	path: Pathname,
	filterParams: Record<string, string | null>
): string {
	return buildURL(filterParams, path).href;
}

export function updateURLParam(key: string, value: string | null): void {
	urlParams[key] = value;
	replaceState(buildURL(urlParams));
}

export function updateURLParams(params: URLParams): void {
	for (const key in params) {
		urlParams[key] = params[key];
	}
	replaceState(buildURL(urlParams));
}

export function useURLParams() {
	resetURLParams();
	afterNavigate(() => {
		// Update the urlParams store when the URL changes
		resetURLParams();
	});
}

export function getURLHash(): string | null {
	const hash = window.location.hash;
	return hash ? decodeURIComponent(hash.substring(1)) : null;
}

export function updateURLHash(hash: string): void {
	const url = new URL(window.location.href);
	url.hash = `#${encodeURIComponent(hash)}`;
	replaceState(url);
}

export function removeURLHash(): void {
	const url = new URL(window.location.href);
	url.hash = '';
	replaceState(url);
}

function replaceState(url: URL): void {
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	svelteReplaceState(url, $state.snapshot(urlParams));
}

function resetURLParams() {
	const searchParams = new URLSearchParams(window.location.search);
	urlParams = Object.fromEntries(searchParams.entries()) as URLParams;
}
