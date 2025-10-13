import { test, expect } from '@playwright/test';

test('emissions: subdivision off annual', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Annual' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/no-subdivision/annual.png`);
});

test('emissions: subdivision off cumulative', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Cumulative' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/no-subdivision/cumulative.png`);
});

test('emissions: aggregation location', async ({ page }) => {
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

test('emissions: aggregation technology and carrier', async ({ page }) => {
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

test('emissions: normalization', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Normalization off' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/subdivision/normalization-on.png`);
});

test('emissions: location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.waitForTimeout(1000); // TODO after upgrading playwright: check if this is still needed
	await page
		.locator('div')
		.filter({ hasText: /^Locations Deselect all$/ })
		.getByRole('button')
		.click();
	await page.waitForTimeout(1000); // TODO after upgrading playwright: check if this is still needed
	await page.getByRole('checkbox', { name: 'DE' }).check();
	await page.waitForTimeout(1000); // TODO after upgrading playwright: check if this is still needed
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/subdivision/location-only-DE.png`);
});

test('emissions: year', async ({ page }) => {
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
