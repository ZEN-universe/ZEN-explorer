import { test } from '@playwright/test';
import {
	expectScreenshot,
	selectFromDropdown,
	selectFromRangeSlider,
	selectRadioOption,
	selectSolution
} from './helper';

const PAGE_URL = '/explorer/map/production';

test('map: default', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await expectScreenshot(page, '#map', `eeht_pf/production/electricity/2022/countries.png`);
});

test('map: energy type', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectRadioOption(page, 'Energy Type', 'consumption');
	await expectScreenshot(page, '#map', `eeht_pf/consumption/electricity/2022/countries.png`);
});

test('map: year', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromRangeSlider(page, 'Year', 2050);
	await expectScreenshot(page, '#map', `eeht_pf/production/electricity/2050/countries.png`);
});

test('map: underlying map', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Map', 'NUTS 1 (only Europe)');
	await expectScreenshot(page, '#map', `eeht_pf/production/electricity/2022/nuts-1.png`);
});
