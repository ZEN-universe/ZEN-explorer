import { test, expect } from '@playwright/test';

test('costs: capex subdivison', async ({ page }) => {
	await page.goto('/transition/costs');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('switch', { name: 'Opex on' }).uncheck();
	await page.getByRole('switch', { name: 'Carrier on' }).uncheck();
	await page.getByRole('switch', { name: 'Shed Demand on' }).uncheck();
	await page.getByRole('switch', { name: 'Carbon Emissions on' }).uncheck();
	await page.getByRole('switch', { name: 'Subdivision off' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/capex-subdivison.png`);
});

test('costs: technologies', async ({ page }) => {
	await page.goto('/transition/costs');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByText('Transport Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Transport' }).click();
	await page.getByRole('option', { name: 'carbon_pipeline' }).click();
	await page.getByText('Storage Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Storage' }).click();
	await page.getByRole('option', { name: 'battery' }).click();
	await page.getByText('Conversion Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Conversion' }).click();
	await page.getByRole('option', { name: 'biomass_boiler', exact: true }).click();
	await page.getByText('Cost of Carrier Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Cost of Carrier' }).click();
	await page.getByRole('option', { name: 'biomass', exact: true }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/technologies-carbon_pipeline-battery-biomass_boiler-biomass.png`
	);
});

test('costs: aggregation by technology & carrier', async ({ page }) => {
	await page.goto('/transition/costs');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	// await page.waitForTimeout(1000);
	await page.getByRole('radio', { name: 'Technology / Carrier' }).click();
	await page.getByText('Locations Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Locations' }).click();
	await page.getByRole('option', { name: 'CH-AT' }).click();
	await page.getByRole('option', { name: 'CH-DE' }).click();
	await page.getByRole('option', { name: 'CH-FR' }).click();
	await page.getByRole('option', { name: 'CH-IT' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/aggregation-by-technology-carrier-at-CH.png`
	);
});

test('costs: years', async ({ page }) => {
	await page.goto('/transition/costs');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('radio', { name: 'Technology / Carrier' }).click();
	await page.getByText('Years Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Years' }).click();
	await page.getByRole('option', { name: '2024' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(`eeht_pf/yeary-only-2024.png`);
});
