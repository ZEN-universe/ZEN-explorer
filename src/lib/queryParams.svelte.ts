import { replaceState, afterNavigate } from '$app/navigation';
import { page } from '$app/state';

export type URLParams = Record<string, string | null>;

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
	url?: string,
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

export function updateURLParam(key: string, value: string | null): void {
	urlParams[key] = value;
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	replaceState(buildURL(urlParams), $state.snapshot(urlParams));
}

export function updateURLParams(params: URLParams): void {
	for (const key in params) {
		urlParams[key] = params[key];
	}
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	replaceState(buildURL(urlParams), $state.snapshot(urlParams));
}

export function useURLParams() {
	resetURLParams();
	afterNavigate(() => {
		// Update the urlParams store when the URL changes
		resetURLParams();
	});
}

function resetURLParams() {
	urlParams = Object.fromEntries(page.url.searchParams.entries()) as URLParams;
}
