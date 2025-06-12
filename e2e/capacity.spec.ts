import { test, expect } from '@playwright/test';

test('EEHT capacity conversion heat', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('heat');
  await expect(page.locator('#myChart')).toHaveScreenshot('eeht/capacity/conversion/heat.png');
});

test('EEHT capacity conversion electricity', async ({ page }) => {
  await page.goto('/transition/capacity/');
  await page.getByLabel('Solution', { exact: true }).selectOption('european_electricity_heating_transition');
  await page.getByLabel('Subsolution').selectOption('perfect_foresight');
  await page.getByLabel('Variable').selectOption('capacity');
  await page.getByLabel('Technology Type').selectOption('conversion');
  await page.getByLabel('Carrier').selectOption('electricity');
  await expect(page.locator('#myChart')).toHaveScreenshot('eeht/capacity/conversion/electricity.png');
});