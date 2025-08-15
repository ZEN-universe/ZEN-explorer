import { test, expect } from '@playwright/test';

test('costs: capex subdivison', async ({ page }) => {
	await page.goto('/transition/costs');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Opex on' }).uncheck();
	await page.getByRole('switch', { name: 'Carrier on' }).uncheck();
	await page.getByRole('switch', { name: 'Shed Demand on' }).uncheck();
	await page.getByRole('switch', { name: 'Carbon Emissions on' }).uncheck();
	await page.getByRole('switch', { name: 'Subdivision off' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/capex-subdivison.png`);
});

test('costs: technologies', async ({ page }) => {
	await page.goto('/transition/costs');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.locator('div')
		.filter({ hasText: /^Transport Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'carbon_pipeline' }).check();
	await page
		.locator('div')
		.filter({ hasText: /^Storage Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'battery' }).check();
	await page
		.locator('div')
		.filter({ hasText: /^Conversion Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'biomass_boiler', exact: true }).check();
	await page.locator('#collapsec14').getByRole('button', { name: 'Deselect all' }).click();
	await page.getByRole('checkbox', { name: 'biomass', exact: true }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/technologies-carbon_pipeline-battery-biomass_boiler-biomass.png`
	);
});

test('costs: aggregation by technology & carrier', async ({ page }) => {
	await page.goto('/transition/costs');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.getByRole('radiogroup')
		.locator('div')
		.filter({ hasText: 'Techology / Carrier' })
		.click();
	await page
		.locator('div')
		.filter({ hasText: /^Locations Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'CH-AT' }).check();
	await page.getByRole('checkbox', { name: 'CH-DE' }).check();
	await page.getByRole('checkbox', { name: 'CH-FR' }).check();
	await page.getByRole('checkbox', { name: 'CH-IT' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(
		`eeht_pf/aggregation-by-technology-carrier-at-CH.png`
	);
});

test('costs: years', async ({ page }) => {
	await page.goto('/transition/costs');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.getByRole('radiogroup')
		.locator('div')
		.filter({ hasText: 'Techology / Carrier' })
		.click();
	await page
		.locator('div')
		.filter({ hasText: /^Years Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: '2024' }).check();
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/yeary-only-2024.png`);
});
