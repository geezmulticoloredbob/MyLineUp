const { test, expect } = require('@playwright/test');

const API_URL = process.env.E2E_API_URL || 'https://mylineup.onrender.com';
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe('MyLineUp live smoke test', () => {
  test('the API health check responds', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.ok()).toBe(true);
  });

  test('an unauthenticated visitor is sent to the login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  });

  test('rejects an invalid login with an error message, not a crash', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('definitely-not-a-real-account@example.com');
    await page.getByLabel('Password').fill('WrongPassword1');
    await page.getByRole('button', { name: /log in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe('with the dedicated test account', () => {
    test.skip(!EMAIL || !PASSWORD, 'E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set — see e2e/.env.example');

    test('logs in and the dashboard loads real favourite team data', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: /log in/i }).click();

      await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Your Lineup' })).toBeVisible();

      // The dedicated test account always follows Boston Celtics (NBA) —
      // see setup-test-account.js. Its team card rendering with real content
      // (not just a loading skeleton) is the actual end-to-end signal that
      // auth, the dashboard API, and the external sports data fetch all
      // worked together against the live stack. "Boston Celtics" also
      // appears in the team-logo-strip nav tile, so target the card's
      // heading specifically.
      await expect(page.getByRole('heading', { name: 'Boston Celtics' })).toBeVisible({ timeout: 30_000 });
    });

    test('logging out returns to the login page', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: /log in/i }).click();
      await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

      await page.getByRole('button', { name: 'Account menu' }).click();
      await page.getByRole('button', { name: 'Log Out' }).click();

      await expect(page).toHaveURL(/\/login$/);
    });
  });
});
