import { test } from '@playwright/test';
import {
	expectScreenshot,
	selectFromDropdown,
	selectFromMultiSelect,
	selectSolution
} from './helper';

const PAGE_URL = '/energy_system';

test(`energy system: default`, async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await expectScreenshot(page, '#diagram', `eeht_pf/all_carriers/2022/all_nodes.png`);
});

test('energy system: carriers', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromMultiSelect(page, 'Carriers', ['biomass']);
	await expectScreenshot(page, '#diagram', `eeht_pf/biomass/2022/all_nodes.png`);
});

test('energy system: year', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Year', '2050');
	await expectScreenshot(page, '#diagram', `eeht_pf/all_carriers/2050/all_nodes.png`);
});

test('energy system: nodes', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromMultiSelect(page, 'Nodes', ['DE']);
	await expectScreenshot(page, '#diagram', `eeht_pf/all_carriers/2022/node-DE.png`);
});
