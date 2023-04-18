import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: 'e2e',

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Reporter to use
  reporter: 'html',
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://127.0.0.1:8787',
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // headless: false,
        launchOptions: {
          args: ['--js-flags=--expose-gc'],
        },
      },
    },
  ],

  // Run your local dev server before starting the tests.
  webServer: [
    {
      command: 'pnpm playwright-build && pnpm playwright-server',
      url: 'http://127.0.0.1:8787',
      reuseExistingServer: false,
      // reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node --expose-gc e2e/servers/formKitMemoryServer.mjs',
      url: 'http://localhost:8686',
      reuseExistingServer: false,
      // reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node --expose-gc e2e/servers/vueMemoryServer.mjs',
      url: 'http://localhost:8585',
      reuseExistingServer: false,
      // reuseExistingServer: !process.env.CI,
    },
  ],
})
