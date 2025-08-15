import { test, expect } from '@playwright/test';

test(`production: carrier`, async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('carbon');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/carbon.png`);
});

test('production: conversion subdivision', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('biomass');
	await page.locator('#subdivision0').check();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/biomass/conversion-subdivision.png`
	);
});

test('production: conversion technology', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('biomass');
	await page.getByRole('checkbox', { name: 'biomass_boiler', exact: true }).uncheck();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/biomass/conversion-technology-without-biomass_boiler.png`
	);
});

test('production: normalization', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('electricity');
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/electricity/normalization-on.png`);
});

test('production: normalization only negative', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('electricity');
	await page.locator('#variables0').uncheck(); // Conversion
	await page.locator('#variables1').uncheck(); // Storage
	await page.locator('#variables2').uncheck(); // Import/Export
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/electricity/normalization-on-negative.png`
	);
});

test('production: nodes', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('biomass');
	await page
		.locator('div')
		.filter({ hasText: /^Nodes Deselect all$/ })
		.getByRole('button')
		.click();
	await expect(page.locator('.plot')).toHaveText('No data with this selection.');
	await page.getByRole('checkbox', { name: 'DE' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/biomass/nodes-only-DE.png`);
});

test('production: years', async ({ page }) => {
	await page.goto('/transition/production/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('biomass');
	await page
		.locator('div')
		.filter({ hasText: /^Years Deselect all$/ })
		.getByRole('button')
		.click();
	await expect(page.locator('.plot')).toHaveText('No data with this selection.');
	await page.getByRole('checkbox', { name: '2024' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/biomass/years-only-2024.png`);
});
