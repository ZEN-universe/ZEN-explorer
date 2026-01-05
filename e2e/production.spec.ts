import { test, expect } from '@playwright/test';

test(`production: carrier subdivision off`, async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'carbon' }).click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/carbon.png`);
});

test('production: conversion subdivision on', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'biomass' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/biomass/conversion-subdivision.png`
	);
});

test('production: conversion technology', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'biomass' }).click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByRole('combobox', { name: 'Conversion' }).click();
	await page.getByRole('option', { name: 'biomass_boiler', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/biomass/conversion-technology-without-biomass_boiler.png`
	);
});

test('production: normalization', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/electricity/normalization-on.png`
	);
});

test('production: normalization only negative', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByText('Conversion on').getByRole('switch').click();
	await page.getByText('Storage on').getByRole('switch').click();
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/electricity/normalization-on-negative.png`
	);
});

test('production: nodes', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'biomass' }).click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('Nodes Deselect All').getByRole('button').click();
	await expect(page.getByRole('main')).toHaveText('No data with this selection');
	await page.getByRole('combobox', { name: 'Nodes' }).click();
	await page.getByRole('option', { name: 'DE' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/biomass/nodes-only-DE.png`
	);
});

test('production: years', async ({ page }) => {
	await page.goto('/transition/production/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'biomass' }).click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('Years Deselect All').getByRole('button').click();
	await expect(page.getByRole('main')).toHaveText('No data with this selection');
	await page.getByRole('combobox', { name: 'Years' }).click();
	await page.getByRole('option', { name: '2024' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/biomass/years-only-2024.png`
	);
});
