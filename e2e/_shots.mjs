import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Load e2e/.env
const repoRoot = 'C:/Users/coenw/source/repos/MyLineUp';
const envPath = path.join(repoRoot, 'e2e', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const API = env.E2E_API_URL;
const BASE = env.E2E_BASE_URL;
const EMAIL = env.E2E_TEST_EMAIL;
const PASSWORD = env.E2E_TEST_PASSWORD;
const OUT = path.join(repoRoot, 'docs', 'screenshots');

const RICH_FAVS = [
  { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics' },
  { league: 'NBA', teamId: 'nba-lal', teamName: 'Los Angeles Lakers' },
  { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal' },
  { league: 'EPL', teamId: 'epl-che', teamName: 'Chelsea' },
  { league: 'LALIGA', teamId: 'lla-rma', teamName: 'Real Madrid' },
  { league: 'LALIGA', teamId: 'lla-atm', teamName: 'Atletico Madrid' },
  { league: 'AFL', teamId: 'afl-haw', teamName: 'Hawthorn' },
  { league: 'AFL', teamId: 'afl-car', teamName: 'Carlton' },
  { league: 'NFL', teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' },
  { league: 'NFL', teamId: 'nfl-buf', teamName: 'Buffalo Bills' },
  { league: 'NHL', teamId: 'nhl-bos', teamName: 'Boston Bruins' },
  { league: 'NHL', teamId: 'nhl-nyr', teamName: 'New York Rangers' },
  { league: 'MLB', teamId: 'mlb-nyy', teamName: 'New York Yankees' },
  { league: 'MLB', teamId: 'mlb-bos', teamName: 'Boston Red Sox' },
];
const RICH_LEAGUES = ['NBA', 'EPL', 'LALIGA', 'AFL', 'NFL', 'NHL', 'MLB'];

// Canonical state the e2e smoke suite expects (see e2e/setup-test-account.js)
const BASE_FAVS = [{ league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics' }];
const BASE_LEAGUES = ['NBA', 'EPL'];

async function api(cookie, pathname, options = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Cookie: cookie, ...options.headers },
  });
  if (!res.ok && res.status !== 201) {
    throw new Error(`${options.method || 'GET'} ${pathname} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

async function login() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login -> ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie');
}

async function setState(cookie, favs, leagues) {
  const { favourites } = await api(cookie, '/api/favourites');
  for (const f of favourites) await api(cookie, `/api/favourites/${f._id}`, { method: 'DELETE' });
  await api(cookie, '/api/leagues', { method: 'PUT', body: JSON.stringify({ leagues }) });
  for (const f of favs) await api(cookie, '/api/favourites', { method: 'POST', body: JSON.stringify(f) });
  await api(cookie, '/api/leagues/complete-onboarding', { method: 'POST' });
}

// Prime the server-side caches so the browser load isn't racing a cold start +
// nine teams hydrating from external sports APIs.
async function warmDashboard(cookie) {
  for (let i = 1; i <= 6; i++) {
    const t0 = Date.now();
    try {
      const data = await api(cookie, '/api/dashboard');
      const n = data?.teams?.length ?? 0;
      console.log(`  warm ${i}: ${n} teams in ${Date.now() - t0}ms`);
      if (n >= RICH_FAVS.length - 1) return;
    } catch (e) {
      console.log(`  warm ${i}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
}

const EXPANDED = JSON.stringify(['BASKETBALL', 'SOCCER', 'AFL', 'GRIDIRON', 'HOCKEY', 'BASEBALL']);

async function newLoggedInPage(browser, { width, height, dsf }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dsf,
  });
  await context.addInitScript((expanded) => {
    localStorage.setItem('mylineup_theme', 'dark');
    localStorage.setItem('mylineup_date_format', 'DD-MM-YYYY');
    localStorage.setItem('mylineup_expanded_sports', expanded);
  }, EXPANDED);
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 60000 });
  await page.getByRole('heading', { name: 'Your Lineup' }).waitFor({ timeout: 60000 });
  // Let the dashboard hydrate from the external sports APIs
  try {
    await page.getByRole('heading', { name: 'Boston Celtics' }).first().waitFor({ timeout: 90000 });
  } catch (e) {
    await page.screenshot({ path: path.join(OUT, '_debug.png'), fullPage: true });
    console.log('DEBUG url:', page.url());
    console.log('DEBUG body:', (await page.locator('body').innerText()).slice(0, 2000));
    throw e;
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);
  return { context, page };
}

async function main() {
  const cookie = await login();
  console.log('Setting rich favourites state...');
  await setState(cookie, RICH_FAVS, RICH_LEAGUES);
  console.log('Warming dashboard caches...');
  await warmDashboard(cookie);

  const browser = await chromium.launch();
  try {
    // --- Desktop: overview (top of page down to the end of the Next Matches feed) ---
    {
      const { context, page } = await newLoggedInPage(browser, { width: 1280, height: 1600, dsf: 2 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const bottom = await page.evaluate(() => {
        const feeds = document.querySelectorAll('.games-feed');
        const last = feeds[feeds.length - 1];
        return last ? Math.ceil(last.getBoundingClientRect().bottom + window.scrollY + 8) : document.body.scrollHeight;
      });
      await page.screenshot({
        path: path.join(OUT, 'dashboard-overview.png'),
        clip: { x: 0, y: 0, width: 1280, height: bottom },
      });
      console.log('dashboard-overview.png', bottom);
      await context.close();
    }

    // --- Desktop: team cards + league standings (narrower viewport = tighter columns) ---
    {
      const { context, page } = await newLoggedInPage(browser, { width: 1040, height: 1200, dsf: 2 });

      const teamGroups = page.locator('.team-groups');
      await teamGroups.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await teamGroups.screenshot({ path: path.join(OUT, 'team-cards.png') });
      console.log('team-cards.png');

      const leagueGroups = page.locator('.league-groups');
      await leagueGroups.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await leagueGroups.screenshot({ path: path.join(OUT, 'league-standings.png') });
      console.log('league-standings.png');
      await context.close();
    }

    // --- Mobile: top of the dashboard (header, tiles, Today + Next Matches) ---
    {
      const { context, page } = await newLoggedInPage(browser, { width: 414, height: 1780, dsf: 3 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, 'mobile-view.png') });
      console.log('mobile-view.png');
      await context.close();
    }
  } finally {
    await browser.close();
    console.log('Restoring canonical e2e account state...');
    await setState(cookie, BASE_FAVS, BASE_LEAGUES);
    console.log('Done.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
