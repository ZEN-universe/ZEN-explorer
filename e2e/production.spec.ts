import { test } from '@playwright/test';
import {
	expectScreenshot,
	selectFromDropdown,
	selectFromMultiSelect,
	selectSolution
} from './helper';

test(`production: carrier subdivision off`, async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'carbon');
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await expectScreenshot(page, '#chart-container', `eeht_pf/carbon.png`);
});

test('production: conversion subdivision on', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'biomass');
	await expectScreenshot(page, '#chart-container', `eeht_pf/biomass/conversion-subdivision.png`);
});

test('production: conversion technology', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'biomass');
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await selectFromDropdown(page, 'Conversion', 'biomass_boiler');
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/biomass/conversion-technology-without-biomass_boiler.png`
	);
});

test('production: normalization', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expectScreenshot(page, '#chart-container', `eeht_pf/electricity/normalization-on.png`);
});

test('production: normalization only negative', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'electricity');
	await page.getByText('Conversion on').getByRole('switch').click();
	await page.getByText('Storage on').getByRole('switch').click();
	await page.getByRole('switch', { name: 'Normalization off' }).click();
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/electricity/normalization-on-negative.png`
	);
});

test('production: nodes', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'biomass');
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await selectFromMultiSelect(page, 'Nodes', ['DE']);
	await expectScreenshot(page, '#chart-container', `eeht_pf/biomass/nodes-only-DE.png`);
});

test('production: years', async ({ page }) => {
	await page.goto('/transition/production/');
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromDropdown(page, 'Carrier', 'biomass');
	await page.getByText('with Subdivision on').first().getByRole('switch').click();
	await selectFromMultiSelect(page, 'Years', ['2024']);
	await expectScreenshot(page, '#chart-container', `eeht_pf/biomass/years-only-2024.png`);
});
