import { test } from '@playwright/test';
import { expectScreenshot, selectFromDropdown, selectSolution } from './helper';

test('map: default', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await expectScreenshot(page, '#map', `eeht_pf/conversion/heat/2022/countries.png`);
});

test('map: technology type', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'carbon');
	await selectFromDropdown(page, 'Technology Type', 'storage');
	await expectScreenshot(page, '#map', `eeht_pf/storage-energy/carbon/2022/countries.png`);
});

test('map: storage type', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'carbon');
	await selectFromDropdown(page, 'Technology Type', 'storage');
	await page.getByRole('radio', { name: 'power' }).check();
	await expectScreenshot(page, '#map', `eeht_pf/storage-power/carbon/2022/countries.png`);
});

test('map: carrier', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await expectScreenshot(page, '#map', `eeht_pf/conversion/electricity/2022/countries.png`);
});

test('map: year', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Year', '2050');
	await expectScreenshot(page, '#map', `eeht_pf/conversion/heat/2050/countries.png`);
});

test('map: underlying map', async ({ page }) => {
	await page.goto('/map');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Map', 'NUTS 1 (only Europe)');
	await expectScreenshot(page, '#map', `eeht_pf/conversion/heat/2022/nuts-1.png`);
});
