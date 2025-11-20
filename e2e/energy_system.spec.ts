import { test, expect } from '@playwright/test';

test(`energy system: default`, async ({ page }) => {
	await page.goto('/energy_system/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/all_carriers/2022/all_nodes.png`
	);
});

test('energy system: carriers', async ({ page }) => {
	await page.goto('/energy_system/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByText('Carriers Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Carriers' }).click();
	await page.getByRole('option', { name: 'biomass', exact: true }).click();
	await expect(page.locator('#diagram')).toHaveScreenshot(`eeht_pf/biomass/2022/all_nodes.png`);
});

test('energy system: year', async ({ page }) => {
	await page.goto('/energy_system/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Year' }).click();
	await page.getByRole('option', { name: '2050', exact: true }).click();
	await expect(page.locator('#diagram')).toHaveScreenshot(
		`eeht_pf/all_carriers/2050/all_nodes.png`
	);
});

test('energy system: nodes', async ({ page }) => {
	await page.goto('/energy_system/');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByText('Nodes Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Nodes' }).click();
	await page.getByRole('option', { name: 'DE', exact: true }).click();
	await expect(page.locator('#diagram')).toHaveScreenshot(`eeht_pf/all_carriers/2022/node-DE.png`);
});
