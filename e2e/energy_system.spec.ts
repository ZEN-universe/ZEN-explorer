import { test, expect } from '@playwright/test';

test(`energy system: default`, async ({ page }) => {
	await page.goto('/energy_system/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/all_carriers/2022/all_nodes.png`
	);
});

test('energy system: carriers', async ({ page }) => {
	await page.goto('/energy_system/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.locator('div')
		.filter({ hasText: /^Carriers Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'biomass' }).check();
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/biomass/2022/all_nodes.png`
	);
});

test('energy system: year', async ({ page }) => {
	await page.goto('/energy_system/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Year').selectOption('2050');
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/all_carriers/2050/all_nodes.png`
	);
});

test('energy system: nodes', async ({ page }) => {
	await page.goto('/energy_system/');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.locator('div')
		.filter({ hasText: /^Nodes Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'DE' }).check();
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/all_carriers/2022/node-DE.png`
	);
});
