import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'staging',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'https://zen-garden-testing.ethz.ch'
			}
		},
		{
			name: 'production',
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'https://zen-garden.ethz.ch'
			}
		}
	],
	webServer: process.env.NO_WEB_SERVER
		? undefined
		: {
				command: 'npm run build && npm run preview',
				port: 4173
			},
	testDir: 'e2e'
});
