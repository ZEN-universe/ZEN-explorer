import { test } from '@playwright/test';
import { expectScreenshot, selectFromDropdown, selectSolution } from './helper';

const PAGE_URL = '/energy_balance/nodal';

test('nodal: default', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2022'); // previous default was 2022
	await selectFromDropdown(page, 'Node', 'AT'); // previous default was AT
	await expectScreenshot(page, '#chart-container', `eeht_pf/default.png`);
});

test('nodal: year', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2050');
	await selectFromDropdown(page, 'Node', 'AT'); // previous default was AT
	await expectScreenshot(page, '#chart-container', `eeht_pf/year-2050.png`);
});

test('nodal: node', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2022'); // previous default was 2022
	await selectFromDropdown(page, 'Node', 'DE');
	await expectScreenshot(page, '#chart-container', `eeht_pf/node-DE.png`);
});

test('nodal: carrier', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2022'); // previous default was 2022
	await selectFromDropdown(page, 'Node', 'AT'); // previous default was AT
	await expectScreenshot(page, '#chart-container', `eeht_pf/carrier-electricity.png`);
});

test('nodal: smoothing window size', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2022'); // previous default was 2022
	await selectFromDropdown(page, 'Node', 'DE');
	await selectFromDropdown(page, 'Smoothing Window Size', 'Monthly');
	await expectScreenshot(page, '#chart-container', `eeht_pf/smoothing-window-size-monthly.png`);
});

test('nodal: dual plot', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectFromDropdown(page, 'Solution', 'operations_with_duals');
	await selectFromDropdown(page, 'Carrier', 'heat'); // previous default was heat
	await selectFromDropdown(page, 'Year', '2023'); // previous default was 2023
	await selectFromDropdown(page, 'Node', 'CH'); // previous default was CH
	await expectScreenshot(page, '#chart-container', `owd/default-chart.png`);
	await expectScreenshot(page, '#chart-duals-container', `owd/default-duals.png`);
});
