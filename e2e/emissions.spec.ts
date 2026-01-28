import { test } from '@playwright/test';
import { expectScreenshot, selectFromMultiSelect, selectSolution } from './helper';

test('emissions: subdivision off annual', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Annual' }).check();
	await expectScreenshot(page, '#chart-container', `eeht_pf/no-subdivision/annual.png`);
});

test('emissions: subdivision off cumulative', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Cumulative' }).check();
	await expectScreenshot(page, '#chart-container', `eeht_pf/no-subdivision/cumulative.png`);
});

test('emissions: aggregation location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('radio', { name: 'Location' }).check();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/subdivision/aggregation-by-location.png`
	);
});

test('emissions: aggregation technology and carrier', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('radio', { name: 'Technology & Carrier' }).check();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/subdivision/aggregation-by-technology-and-carrier.png`
	);
});

test('emissions: normalization', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('switch', { name: 'Normalization off' }).check();
	await expectScreenshot(page, '#chart-container', `eeht_pf/subdivision/normalization-on.png`);
});

test('emissions: location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromMultiSelect(page, 'Locations', ['DE']);
	await expectScreenshot(page, '#chart-container', `eeht_pf/subdivision/location-only-DE.png`);
});

test('emissions: year', async ({ page }) => {
	await page.goto('/transition/emissions');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromMultiSelect(page, 'Years', ['2024']);
	await expectScreenshot(page, '#chart-container', `eeht_pf/subdivision/year-only-2024.png`);
});
