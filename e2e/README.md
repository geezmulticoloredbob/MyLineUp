# E2E smoke tests

Playwright tests against the **live deployed app** (Vercel + Render + Atlas), not against a local dev server. This is a smoke test of the real production stack — separate from, and complementary to, the fast unit-test suites in `client/` and `server/` that run in CI on every push/PR.

Deliberately **not** wired into CI: it depends on Render's free-tier cold start and real third-party sports APIs, both of which would make an every-PR gate flaky and slow. Run it manually, or wire it into a scheduled check if you want ongoing monitoring.

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
cp .env.example .env   # then fill in E2E_TEST_EMAIL / E2E_TEST_PASSWORD
```

The test suite needs a dedicated test account (not your personal one) that already exists with onboarding complete and a favourite team set, so the dashboard has real data to assert against. Create/refresh it with:

```bash
node setup-test-account.js
```

This is idempotent — safe to re-run any time (logs in instead of re-registering if the account already exists, and resets its followed leagues/favourite/onboarding state either way).

## Running

```bash
npm run test:e2e
```

## What's covered

- API health check responds
- An unauthenticated visitor is redirected to `/login`
- An invalid login shows an error, doesn't crash
- Logging in with the test account loads the dashboard with real favourite-team data (the actual end-to-end signal — proves auth, the dashboard API, and the external sports data fetch all work together against the live stack)
- Logging out returns to `/login`
