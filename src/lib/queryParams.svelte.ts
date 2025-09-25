import { replaceState } from '$app/navigation';
import { page } from '$app/state';

export interface URLParams {
	[key: string]: string | null;
}

let urlParams: URLParams = $state({});

export function getURLParam(key: string): string | null {
	const state = page.state as Record<string, string>;
	const urlParams = page.url.searchParams;
	const value = state[key] ?? urlParams.get(key);
	return value ? decodeURIComponent(value) : null;
}

export function getURLParamAsIntArray(key: string): number[] {
	const param = getURLParam(key);
	if (!param) return [];
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
		if (params[key]) {
			url.searchParams.set(key, params[key]);
		} else {
			url.searchParams.delete(key);
		}
	}
	return url;
}

export function addCurrentSolutionToURL(url?: string): string {
	return buildURL(
		{
			solution: urlParams['solution'] || getURLParam('solution') || '',
			scenario: urlParams['scenario'] || getURLParam('scenario') || ''
		},
		url
	).href;
}

export function updateURLParams(params: URLParams): void {
	urlParams = { ...urlParams, ...params };
	replaceState(buildURL(params), $state.snapshot(urlParams));
}
