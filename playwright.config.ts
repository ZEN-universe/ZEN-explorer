import { defineConfig } from '@playwright/test';

export default defineConfig({
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'e2e'
});
