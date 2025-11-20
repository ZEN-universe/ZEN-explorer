import { test, expect } from '@playwright/test';

test('emissions: subdivision off annual', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Annual' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/no-subdivision/annual.png`
	);
});

test('emissions: subdivision off cumulative', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('switch', { name: 'Subdivision on' }).uncheck();
	await page.getByRole('radio', { name: 'Cumulative' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/no-subdivision/cumulative.png`
	);
});

test('emissions: aggregation location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('radio', { name: 'Location' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/subdivision/aggregation-by-location.png`
	);
});

test('emissions: aggregation technology and carrier', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('radio', { name: 'Technology & Carrier' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/subdivision/aggregation-by-technology-and-carrier.png`
	);
});

test('emissions: normalization', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByRole('switch', { name: 'Normalization off' }).check();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/subdivision/normalization-on.png`
	);
});

test('emissions: location', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByText('Locations Deselect All').getByRole('button').click();
	await page.getByRole('combobox', { name: 'Locations' }).click();
	await page.getByRole('option', { name: 'DE' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/subdivision/location-only-DE.png`
	);
});

test('emissions: year', async ({ page }) => {
	await page.goto('/transition/emissions');
	await page.getByRole('combobox', { name: 'Solution', exact: true }).click();
	await page.getByRole('option', { name: 'european_electricity_heating_transition' }).click();
	await page.getByRole('combobox', { name: 'Subsolution' }).click();
	await page.getByRole('option', { name: 'perfect_foresight' }).click();
	await page.getByText('Years Deselect All').getByRole('button').click();
	await expect(page.getByRole('main')).toHaveText('No data with this selection.');
	await page.getByRole('combobox', { name: 'Years' }).click();
	await page.getByRole('option', { name: '2024' }).click();
	await expect(page.locator('#chart-container')).toHaveScreenshot(
		`eeht_pf/subdivision/year-only-2024.png`
	);
});
