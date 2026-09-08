// One-time (and re-runnable) setup for the dedicated E2E test account used
// by tests/dashboard.spec.js. Registers the account if it doesn't exist yet,
// follows a couple of leagues, adds a favourite team so the dashboard has
// real data to assert against, and marks onboarding complete. Safe to
// re-run — every step is idempotent against the real production API.
//
// Usage: node setup-test-account.js  (reads e2e/.env)
require('dotenv').config();

const API_URL = process.env.E2E_API_URL;
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!API_URL || !EMAIL || !PASSWORD) {
  console.error('Missing E2E_API_URL / E2E_TEST_EMAIL / E2E_TEST_PASSWORD — copy e2e/.env.example to e2e/.env and fill it in.');
  process.exit(1);
}

async function main() {
  let cookie;

  const registerRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'E2E Test', email: EMAIL, password: PASSWORD }),
  });

  if (registerRes.ok) {
    console.log('Registered new test account.');
    cookie = registerRes.headers.get('set-cookie');
  } else if (registerRes.status === 409) {
    console.log('Test account already exists — logging in instead.');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    cookie = loginRes.headers.get('set-cookie');
  } else {
    throw new Error(`Register failed: ${registerRes.status} ${await registerRes.text()}`);
  }

  const authedFetch = (path, options = {}) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Cookie: cookie, ...options.headers },
    });

  const leaguesRes = await authedFetch('/api/leagues', {
    method: 'PUT',
    body: JSON.stringify({ leagues: ['NBA', 'EPL'] }),
  });
  if (!leaguesRes.ok) throw new Error(`Setting leagues failed: ${leaguesRes.status} ${await leaguesRes.text()}`);
  console.log('Followed leagues set: NBA, EPL.');

  const favouriteRes = await authedFetch('/api/favourites', {
    method: 'POST',
    body: JSON.stringify({ league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics' }),
  });
  if (!favouriteRes.ok && favouriteRes.status !== 201) {
    throw new Error(`Adding favourite failed: ${favouriteRes.status} ${await favouriteRes.text()}`);
  }
  console.log('Favourite team set: Boston Celtics (NBA).');

  const onboardingRes = await authedFetch('/api/leagues/complete-onboarding', { method: 'POST' });
  if (!onboardingRes.ok) throw new Error(`Completing onboarding failed: ${onboardingRes.status} ${await onboardingRes.text()}`);
  console.log('Onboarding marked complete.');

  console.log('\nE2E test account ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
