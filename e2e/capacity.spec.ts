import { test } from '@playwright/test';
import {
	expectScreenshot,
	selectFromDropdown,
	selectFromMultiSelect,
	selectSolution
} from './helper';

test(`capacity: variable`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Variable', 'capacity_addition');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity_addition/conversion/energy/heat.png`
	);
});

test('capacity: technology_type', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'natural_gas');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'transport');
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/transport/energy/natural_gas.png`
	);
});

test('capacity: storage_type', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'storage');
	await page.getByRole('radio', { name: 'power' }).click();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/storage/power/electricity.png`
	);
});

test('capacity: carrier', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/conversion/energy/electricity.png`
	);
});

test(`capacity: aggregation`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await page.getByRole('radio', { name: 'Technology' }).check();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/conversion/energy/heat--aggregation-technology.png`
	);
});

test(`capacity: normalization`, async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/conversion/energy/heat--normalization-on.png`
	);
});

test('capacity: node selection', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await selectFromMultiSelect(page, 'Nodes', ['DE']);
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/conversion/energy/heat--node-DE.png`
	);
});

test('capacity: year selection', async ({ page }) => {
	await page.goto('/transition/capacity/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'heat');
	await selectFromDropdown(page, 'Variable', 'capacity');
	await selectFromDropdown(page, 'Technology Type', 'conversion');
	await selectFromMultiSelect(page, 'Years', ['2024']);
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/capacity/conversion/energy/heat--year-selection.png`
	);
});
