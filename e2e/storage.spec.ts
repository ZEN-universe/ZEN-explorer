import { test, expect } from '@playwright/test';

test('storage: default', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await expect(page.locator('#level_chart')).toHaveScreenshot(`eeht_pf/default/level.png`);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(`eeht_pf/default/flow.png`);
});

test('storage: year', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Year').selectOption('2050');
	await expect(page.locator('#level_chart')).toHaveScreenshot(`eeht_pf/year-2050/level.png`);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(`eeht_pf/year-2050/flow.png`);
});

test('storage: carrier', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Carrier').selectOption('electricity');
	await expect(page.locator('#level_chart')).toHaveScreenshot(
		`eeht_pf/carrier-electricity/level.png`
	);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(
		`eeht_pf/carrier-electricity/flow.png`
	);
});

test('storage: smoothing window size', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByLabel('Smoothing Window Size').selectOption('Monthly');
	await expect(page.locator('#level_chart')).toHaveScreenshot(
		`eeht_pf/smoothing-window-size-monthly/level.png`
	);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(
		`eeht_pf/smoothing-window-size-monthly/flow.png`
	);
});

test('storage: technology subdivision', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page.getByRole('switch', { name: 'Technology Subdivision on' }).uncheck();
	await expect(page.locator('#level_chart')).toHaveScreenshot(
		`eeht_pf/technology-subdivision/level.png`
	);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(
		`eeht_pf/technology-subdivision/flow.png`
	);
});

test('storage: technologies', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.locator('div')
		.filter({ hasText: /^Technologies Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'battery' }).check();
	await expect(page.locator('#level_chart')).toHaveScreenshot(
		`eeht_pf/technologies-battery/level.png`
	);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(
		`eeht_pf/technologies-battery/flow.png`
	);
});

test('storage: nodes', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page
		.getByLabel('Solution', { exact: true })
		.selectOption('european_electricity_heating_transition');
	await page.getByLabel('Subsolution').selectOption('perfect_foresight');
	await page
		.locator('div')
		.filter({ hasText: /^Nodes Deselect all$/ })
		.getByRole('button')
		.click();
	await page.getByRole('checkbox', { name: 'DE' }).check();
	await expect(page.locator('#level_chart')).toHaveScreenshot(`eeht_pf/nodes-only-de/level.png`);
	await expect(page.locator('#flow_chart')).toHaveScreenshot(`eeht_pf/nodes-only-de/flow.png`);
});
