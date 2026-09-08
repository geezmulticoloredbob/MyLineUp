require('dotenv').config();
const { defineConfig } = require('@playwright/test');

// Points at the live deployed app by default — this suite is a smoke test
// of the real Vercel + Render + Atlas stack, not a substitute for the fast
// unit tests in client/ and server/ that CI runs on every push/PR.
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // shares one login session across tests — keep sequential
  retries: 1, // Render's free tier can cold-start; one retry absorbs that
  timeout: 60_000, // cold start can take 30-60s on the first request
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://my-line-up.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
