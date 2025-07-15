import { test, expect } from '@playwright/test';

test('Emissions: Subdivision Annual', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Annual' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/no-subdivision/annual.png`);
});

test('Emissions: Subdivision Cumulative', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Cumulative' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/no-subdivision/cumulative.png`);
});

test('Emissions: Aggregation Location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('radio', { name: 'Location' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/subdivision/aggregation-by-location.png`
	);
});

test('Emissions: Aggregation Technology and Carrier', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('radio', { name: 'Technology & Carrier' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/subdivision/aggregation-by-technology-and-carrier.png`
	);
});

test('Emissions: Normalization', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Normalization off' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/subdivision/normalization-on.png`);
});

test('Emissions: Location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.locator('div')
		.filter({ hasText: /^Locations Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'DE' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/subdivision/location-only-DE.png`);
});

test('Emissions: Year', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.locator('div')
		.filter({ hasText: /^Years Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: '2024' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/subdivision/year-only-2024.png`);
});
