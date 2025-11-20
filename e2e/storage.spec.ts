import { test, expect } from '@playwright/test';

test('storage: default', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/default/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(`eeht_pf/default/flow.png`);
});

test('storage: year', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Year' }).click();
	await page.getByRole('option', { name: '2050', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/year-2050/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/year-2050/flow.png`
	);
});

test('storage: carrier', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'natural_gas', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/carrier-natural_gas/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/carrier-natural_gas/flow.png`
	);
});

test('storage: smoothing window size', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Smoothing Window Size' }).click();
	await page.getByRole('option', { name: 'Monthly', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/smoothing-window-size-monthly/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/smoothing-window-size-monthly/flow.png`
	);
});

test('storage: technology subdivision', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.waitForSelector('#level_chart');
	await page.getByRole('switch', { name: 'Technology Subdivision on' }).uncheck();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/technology-subdivision/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/technology-subdivision/flow.png`
	);
});

test('storage: technologies', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Year' }).click();
	await page.getByRole('option', { name: '2050', exact: true }).click();
	await page.getByText('Technologies Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Technologies' }).click();
	await page.getByRole('option', { name: 'battery', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/technologies-battery-2050/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/technologies-battery-2050/flow.png`
	);
});

test('storage: nodes', async ({ page }) => {
	await page.goto('/energy_balance/storage');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByText('Nodes Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Nodes' }).click();
	await page.getByRole('option', { name: 'DE', exact: true }).click();
	await expect(page.locator('#level_chart-container')).toHaveScreenshot(
		`eeht_pf/nodes-only-de/level.png`
	);
	await expect(page.locator('#flow_chart-container')).toHaveScreenshot(
		`eeht_pf/nodes-only-de/flow.png`
	);
});
