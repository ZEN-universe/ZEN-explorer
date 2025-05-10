import { page } from '$app/state';

interface URLParams {
    [key: string]: string;
}

export function get_url_param(key: string): string | null {
    const urlParams = page.url.searchParams;
    const value = urlParams.get(key);
    return value ? decodeURIComponent(value) : null;
}

export function build_url(params: URLParams, base_url?: string): string {
    if (!base_url) {
        base_url = window.location.href;
    }
   
    const url = new URL(base_url, window.location.origin);
    for (const key in params) {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        }
    }
    return url.toString();
}

export function add_current_solution_to_url(url?: string): string {
    return build_url({
        'solution': get_url_param('solution') || '',
        'scenario': get_url_param('scenario') || '',
    }, url);
}
