import { test } from '@playwright/test';
import { expectScreenshot, selectFromDropdown, selectSolution } from './helper';

test('nodal: default', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await expectScreenshot(page, '#chart-container', `eeht_pf/default.png`);
});

test('nodal: year', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2050');
	await expectScreenshot(page, '#chart-container', `eeht_pf/year-2050.png`);
});

test('nodal: node', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Node', 'DE');
	await expectScreenshot(page, '#chart-container', `eeht_pf/node-DE.png`);
});

test('nodal: carrier', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await expectScreenshot(page, '#chart-container', `eeht_pf/carrier-electricity.png`);
});

test('nodal: smoothing window size', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Node', 'DE');
	await selectFromDropdown(page, 'Smoothing Window Size', 'Monthly');
	await expectScreenshot(page, '#chart-container', `eeht_pf/smoothing-window-size-monthly.png`);
});

test('nodal: dual plot', async ({ page }) => {
	await page.goto('/energy_balance/nodal');
	await selectFromDropdown(page, 'Solution', 'operations_with_duals');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await expectScreenshot(page, '#chart-container', `owd/default-chart.png`);
	await expectScreenshot(page, '#chart-duals-container', `owd/default-duals.png`);
});
