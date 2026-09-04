import { test, expect } from '@playwright/test';

/**
 * Regression check for the Safari-only bug where selecting a carrier in the
 * custom <Select> dropdown did nothing.
 *
 * Root cause: WebKit does not move focus to <button> elements on click, so the
 * combobox's `blur` handler saw `relatedTarget === null`, assumed an outside
 * click, and closed the option list before the option's `click` handler ran.
 *
 * Run against production (old code, expected to FAIL on webkit):
 *   $env:NO_WEB_SERVER=1; npx playwright test e2e/carrier-safari-repro.spec.ts --project=webkit-production
 *
 * Run against a local build with the fix (expected to PASS):
 *   npx playwright test e2e/carrier-safari-repro.spec.ts --project=webkit
 *
 * Sanity check that Chromium was never affected:
 *   npx playwright test e2e/carrier-safari-repro.spec.ts --project=chromium
 */
test('carrier can be selected from the dropdown', async ({ page }) => {
	await page.goto(
		'/explorer/transition/capacity/?solutions=technology_optimism_pessimism.Crystal_Ball&scenarios=none'
	);

	const combobox = page.getByRole('combobox', { name: 'Carrier', disabled: false });
	await combobox.click();
	await expect(combobox).toHaveAttribute('aria-expanded', 'true');

	const firstOption = page.getByRole('option').first();
	const carrierName = ((await firstOption.textContent()) ?? '').trim();
	expect(carrierName).not.toBe('');
	await firstOption.click();

	// The combobox should now show the chosen carrier ...
	await expect(combobox).toContainText(carrierName);
	// ... and the selection should be reflected in the URL.
	await expect(page).toHaveURL(/[?&]carrier=/);
});
