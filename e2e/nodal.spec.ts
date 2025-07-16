import { test, expect } from '@playwright/test';

test('nodal: default', async ({ page }) => {
  await page.goto('/energy_balance/nodal');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/default.png`);
});

test('nodal: year', async ({ page }) => {
  await page.goto('/energy_balance/nodal');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Year').selectOption('2050');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/year-2050.png`);
});

test('nodal: node', async ({ page }) => {
  await page.goto('/energy_balance/nodal');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Node').selectOption('DE');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/node-DE.png`);
});

test('nodal: carrier', async ({ page }) => {
  await page.goto('/energy_balance/nodal');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Carrier').selectOption('electricity');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/carrier-electricity.png`);
});

test('nodal: smoothing window size', async ({ page }) => {
  await page.goto('/energy_balance/nodal');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Smoothing Window Size').selectOption('Monthly');
	await expect(page.locator('#chart')).toHaveScreenshot(`eeht_pf/smoothing-window-size-monthly.png`);
});

