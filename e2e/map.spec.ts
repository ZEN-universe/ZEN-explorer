import { test, expect } from '@playwright/test';

test('map: default', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2022/countries.png`);
});

test('map: technology type', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Technology Type').selectOption('storage');
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/storage-energy/carbon/2022/countries.png`
	);
});

test('map: storage type', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Technology Type').selectOption('storage');
	await page.getByRole('radio', { name: 'power' }).check();
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/storage-power/carbon/2022/countries.png`
	);
});

test('map: carrier', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('electricity');
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/conversion/electricity/2022/countries.png`
	);
});

test('map: year', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Year').selectOption('2050');
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2050/countries.png`);
});

test('map: underlying map', async ({ page }) => {
	await page.goto('/map');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.waitForTimeout(1000); // Wait for the map to load
	await page.getByLabel('Map').selectOption('nuts-1');
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2022/nuts-1.png`);
});
