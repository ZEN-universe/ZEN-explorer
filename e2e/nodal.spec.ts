import { test, expect } from '@playwright/test';

test('nodal: default', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click(); // previous default was heat
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/default.png`);
});

test('nodal: year', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click(); // previous default was heat
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Year' }).click();
	await page.getByRole('option', { name: '2050', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/year-2050.png`);
});

test('nodal: node', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click(); // previous default was heat
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Node' }).click();
	await page.getByRole('option', { name: 'DE', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/node-DE.png`);
});

test('nodal: carrier', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/carrier-electricity.png`
	);
});

test('nodal: smoothing window size', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click(); // previous default was heat
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Node' }).click();
	await page.getByRole('option', { name: 'DE', exact: true }).click();
	await page.getByRole('combobox', { name: 'Smoothing Window Size' }).click();
	await page.getByRole('option', { name: 'Monthly', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/smoothing-window-size-monthly.png`
	);
});

test('nodal: dual plot', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'operations_with_duals' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click(); // previous default was heat
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`owd/default-chart.png`);
	await expect(page.locator('#chart-duals-container')).toHaveScreenshot(`owd/default-duals.png`);
});
