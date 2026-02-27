import { test } from '@playwright/test';
import { expectScreenshot, selectFromMultiSelect, selectSolution } from './helper';

const PAGE_URL = '/transition/costs';

test('costs: capex subdivison', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('switch', { name: 'Opex on' }).uncheck();
	await page.getByRole('switch', { name: 'Carrier on' }).uncheck();
	await page.getByRole('switch', { name: 'Shed Demand on' }).uncheck();
	await page.getByRole('switch', { name: 'Carbon Emissions on' }).uncheck();
	await page.getByRole('switch', { name: 'Subdivision off' }).check();
	await expectScreenshot(page, '#chart-container', `eeht_pf/capex-subdivison.png`);
});

test('costs: technologies', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await selectFromMultiSelect(page, 'Transport', ['carbon_pipeline']);
	await selectFromMultiSelect(page, 'Storage', ['battery']);
	await selectFromMultiSelect(page, 'Conversion', ['biomass_boiler']);
	await selectFromMultiSelect(page, 'Cost of Carrier', ['biomass']);
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/technologies-carbon_pipeline-battery-biomass_boiler-biomass.png`
	);
});

test('costs: aggregation by technology & carrier', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	// await page.waitForTimeout(1000);
	await page.getByRole('radio', { name: 'Technology / Carrier' }).click();
	await selectFromMultiSelect(page, 'Locations', ['CH-AT', 'CH-DE', 'CH-FR', 'CH-IT']);
	await expectScreenshot(
		page,
		'#chart-container',
		`eeht_pf/aggregation-by-technology-carrier-at-CH.png`
	);
});

test('costs: years', async ({ page }) => {
	await page.goto(PAGE_URL);
	await selectSolution(page, 'european_electricity_heating_transition', 'perfect_foresight');
	await page.getByRole('radio', { name: 'Technology / Carrier' }).click();
	await selectFromMultiSelect(page, 'Years', ['2024']);
	await expectScreenshot(page, '#chart-container', `eeht_pf/yeary-only-2024.png`);
});
