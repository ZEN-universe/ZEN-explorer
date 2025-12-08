import { test, expect } from '@playwright/test';

test('map: default', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2022/countries.png`);
});

test('map: technology type', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'carbon', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'storage' }).click();
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/storage-energy/carbon/2022/countries.png`
	);
});

test('map: storage type', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'carbon', exact: true }).click();
	await page.getByRole('combobox', { name: 'Technology Type' }).click();
	await page.getByRole('option', { name: 'storage' }).click();
	await page.getByRole('radio', { name: 'power' }).check();
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/storage-power/carbon/2022/countries.png`
	);
});

test('map: carrier', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'electricity', exact: true }).click();
	await expect(page.locator('#map')).toHaveScreenshot(
		`eeht_pf/conversion/electricity/2022/countries.png`
	);
});

test('map: year', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Year' }).click();
	await page.getByRole('option', { name: '2050' }).click();
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2050/countries.png`);
});

test('map: underlying map', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('combobox', { name: 'Carrier' }).click();
	await page.getByRole('option', { name: 'heat', exact: true }).click();
	await page.getByRole('combobox', { name: 'Map' }).click();
	await page.getByRole('option', { name: 'NUTS 1 (only Europe)' }).click();
	await expect(page.locator('#map')).toHaveScreenshot(`eeht_pf/conversion/heat/2022/nuts-1.png`);
});
