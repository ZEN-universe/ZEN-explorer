import { test } from '@playwright/test';
import {
	expectScreenshot,
	selectFromDropdown,
	selectFromMultiSelect,
	selectSolution
} from './helper';

const PAGE_URL = '/energy_balance/storage';

test('storage: default', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2022');
	await expectScreenshot(page, '#level_chart-container', `eeht_pf/default/level.png`);
	await expectScreenshot(page, '#flow_chart-container', `eeht_pf/default/flow.png`);
});

test('storage: year', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2050');
	await expectScreenshot(page, '#level_chart-container', `eeht_pf/year-2050/level.png`);
	await expectScreenshot(page, '#flow_chart-container', `eeht_pf/year-2050/flow.png`);
});

test('storage: carrier', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'natural_gas');
	await selectFromDropdown(page, 'Year', '2022');
	await expectScreenshot(page, '#level_chart-container', `eeht_pf/carrier-natural_gas/level.png`);
	await expectScreenshot(page, '#flow_chart-container', `eeht_pf/carrier-natural_gas/flow.png`);
});

test('storage: smoothing window size', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2022');
	await selectFromDropdown(page, 'Smoothing Window Size', 'Monthly');
	await expectScreenshot(
		page,
		'#level_chart-container',
		`eeht_pf/smoothing-window-size-monthly/level.png`
	);
	await expectScreenshot(
		page,
		'#flow_chart-container',
		`eeht_pf/smoothing-window-size-monthly/flow.png`
	);
});

test('storage: technology subdivision', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2022');
	await page.getByRole('switch', { name: 'Technology Subdivision on' }).uncheck();
	await expectScreenshot(
		page,
		'#level_chart-container',
		`eeht_pf/technology-subdivision/level.png`
	);
	await expectScreenshot(page, '#flow_chart-container', `eeht_pf/technology-subdivision/flow.png`);
});

test('storage: technologies', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2050');
	await selectFromMultiSelect(page, 'Technologies', ['battery']);
	await expectScreenshot(
		page,
		'#level_chart-container',
		`eeht_pf/technologies-battery-2050/level.png`
	);
	await expectScreenshot(
		page,
		'#flow_chart-container',
		`eeht_pf/technologies-battery-2050/flow.png`
	);
});

test('storage: nodes', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Year', '2022');
	await selectFromMultiSelect(page, 'Nodes', ['DE']);
	await expectScreenshot(page, '#level_chart-container', `eeht_pf/nodes-only-de/level.png`);
	await expectScreenshot(page, '#flow_chart-container', `eeht_pf/nodes-only-de/flow.png`);
});
