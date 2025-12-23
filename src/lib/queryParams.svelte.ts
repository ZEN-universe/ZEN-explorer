import { replaceState } from '$app/navigation';
import { page } from '$app/state';

export type URLParams = Record<string, string | null>;

let urlParams: Record<string, string | null> = $state({});

function getRawURLParam(key: string): string | null {
	const state = page.state as Record<string, string>;
	const urlParams = page.url.searchParams;
	return state[key] ?? urlParams.get(key);
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

export function updateURLParams(params: URLParams): void {
	urlParams = { ...urlParams, ...params };
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	replaceState(buildURL(params), $state.snapshot(urlParams));
}
