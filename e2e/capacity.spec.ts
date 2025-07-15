import { test, expect } from '@playwright/test';

test(`capacity: variable`, async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity_addition');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity_addition/conversion/energy/heat.png`
  );
});

test('capacity: technology_type', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('transport');
  await page.getByLabel('Carrier').selectOption('natural_gas');
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/transport/energy/natural_gas.png`
  );
});

test('capacity: storage_type', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('storage');
  await page.getByRole('radio', { name: 'power' }).click();
  await page.getByLabel('Carrier').selectOption('electricity');
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/storage/power/electricity.png`
  );
});

test('capacity: carrier', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('electricity');
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/conversion/energy/electricity.png`
  );
});

test(`capacity: aggregation`, async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await page.getByRole('radio', { name: 'Technology' }).check();
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/conversion/energy/heat--aggregation-technology.png`
  );
});

test(`capacity: normalization`, async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await page.getByRole('switch', { name: 'Normalization off' }).click();
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/conversion/energy/heat--normalization-on.png`
  );
});

test('capacity: node selection', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await page.locator('div').filter({ hasText: /^Nodes Deselect all$/ }).getByRole('button').click();
  await expect(page.locator('.plot')).toHaveText('No data with this selection.');
  await page.getByRole('checkbox', { name: 'DE' }).check();
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/conversion/energy/heat--node-DE.png`
  );
});

test('capacity: year selection', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page
    .getByLabel('Solution', { exact: true })
    .selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await page.locator('div').filter({ hasText: /^Years Deselect all$/ }).getByRole('button').click();
  await expect(page.locator('.plot')).toHaveText('No data with this selection.');
  await page.getByRole('checkbox', { name: '2024' }).check();
  await expect(page.locator('#chart')).toHaveScreenshot(
    `eeht_pf/capacity/conversion/energy/heat--year-selection.png`
  );
});
