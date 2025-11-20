import { test, expect } from '@playwright/test';

test(`capacity: variable`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity_addition' }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity_addition/conversion/energy/heat.png`
	);
});

test('capacity: technology_type', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'natural_gas', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'transport', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/transport/energy/natural_gas.png`
	);
});

test('capacity: storage_type', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'storage' }).click();
	await page.getByRole('radio', { name: 'power' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/storage/power/electricity.png`
	);
});

test('capacity: carrier', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/conversion/energy/electricity.png`
	);
});

test(`capacity: aggregation`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await page.getByRole('radio', { name: 'Technology' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/conversion/energy/heat--aggregation-technology.png`
	);
});

test(`capacity: normalization`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/conversion/energy/heat--normalization-on.png`
	);
});

test('capacity: node selection', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await page.getByText('Nodes Deselect All').getByRole('button').click();
	await expect(page.getByRole('main')).toHaveText('No data with this selection.');
	await page.getByRole('combobox', { name: 'Nodes' }).click();
	await page.getByRole('option', { name: 'DE' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/conversion/energy/heat--node-DE.png`
	);
});

test('capacity: year selection', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Variable' }).click();
	await page.getByRole('option', { name: 'capacity', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'conversion' }).click();
	await page.getByText('Years Deselect All').getByRole('button').click();
	await expect(page.getByRole('main')).toHaveText('No data with this selection.');
	await page.getByRole('combobox', { name: 'Years' }).click();
	await page.getByRole('option', { name: '2024' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/capacity/conversion/energy/heat--year-selection.png`
	);
});
