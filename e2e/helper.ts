import { expect, Page } from '@playwright/test';

export async function selectSolution(page: Page, solution: string, subsolution: string) {
	await selectFromDropdown(page, 'Solution', solution);
	await selectFromDropdown(page, 'Subsolution', subsolution);
}

export async function selectFromDropdown(page: Page, dropdownLabel: string, optionName: string) {
	await page.getByRole('combobox', { name: dropdownLabel }).click();
	await page.getByRole('option', { name: optionName, exact: true }).click();
}

export async function selectFromMultiSelect(
	page: Page,
	dropdownLabel: string,
	optionNames: string[]
) {
	await page.getByText(`${dropdownLabel} Deselect All`).getByRole('button').click();
	await page.getByRole('combobox', { name: dropdownLabel }).click();
	for (const optionName of optionNames) {
		await page.getByRole('option', { name: optionName, exact: true }).click();
	}
	await page.getByRole('combobox', { name: dropdownLabel }).locator('.handle').first().click();
}

export async function expectScreenshot(page: Page, locator: string, screenshotName: string) {
	await page.locator('h1').first().hover();
	await expect(page.locator(locator)).toHaveScreenshot(screenshotName);
}
