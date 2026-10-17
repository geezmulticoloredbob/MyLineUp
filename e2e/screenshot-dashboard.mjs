// Regenerates the README screenshots in docs/screenshots/ from the live
// deployed app, using the dedicated e2e test account (see e2e/.env).
//
// It temporarily loads that account up with a spread of favourites across
// every sport, captures the shots, then restores the account to the lean
// state the smoke suite expects (see setup-test-account.js). Safe to re-run.
//
// Usage: node e2e/screenshot-dashboard.mjs   (needs `npx playwright install chromium`,
// plus ffmpeg on PATH for the README GIF — skipped with a warning without it)
import { chromium } from 'playwright';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(e2eDir, '..');
const OUT = path.join(repoRoot, 'docs', 'screenshots');

const env = Object.fromEntries(
  readFileSync(path.join(e2eDir, '.env'), 'utf8')
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

if (!API || !BASE || !EMAIL || !PASSWORD) {
  console.error('Missing E2E_* vars — copy e2e/.env.example to e2e/.env and fill it in.');
  process.exit(1);
}

// Two teams per sport so the dashboard grid renders full rather than half-empty.
// Pick leagues that are in season when you run this — an off-season card is
// mostly "No recent result available", which reads as broken in a README.
const RICH_FAVS = [
  { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal' },
  { league: 'EPL', teamId: 'epl-mci', teamName: 'Manchester City' },
  { league: 'LALIGA', teamId: 'lla-rma', teamName: 'Real Madrid' },
  { league: 'LALIGA', teamId: 'lla-bar', teamName: 'Barcelona' },
  { league: 'NFL', teamId: 'nfl-buf', teamName: 'Buffalo Bills' },
  { league: 'NFL', teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' },
  { league: 'NHL', teamId: 'nhl-edm', teamName: 'Edmonton Oilers' },
  { league: 'NHL', teamId: 'nhl-fla', teamName: 'Florida Panthers' },
];
const RICH_LEAGUES = [...new Set(RICH_FAVS.map((f) => f.league))];

// Canonical state the smoke suite expects (mirrors setup-test-account.js).
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

// Prime the server-side caches so the browser load isn't racing a Render cold
// start plus fourteen teams hydrating from the external sports APIs.
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
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dsf });
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
  await page.getByRole('heading', { name: RICH_FAVS[0].teamName }).first().waitFor({ timeout: 180000 });
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
    // Overview: top of the page down to the end of the Next Matches feed.
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
      console.log('dashboard-overview.png');
      await context.close();
    }

    // Team cards + league standings, on a narrower viewport for tighter columns.
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

    // Mobile: header, tiles, team pills, Today + Next Matches.
    {
      const { context, page } = await newLoggedInPage(browser, { width: 430, height: 1820, dsf: 3 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, 'mobile-view.png') });
      console.log('mobile-view.png');
      await context.close();
    }
    // README GIF: a short scroll from the sport tiles down through the team
    // cards into the league standings. Recorded as video, then converted with
    // ffmpeg (palette pass keeps the dark theme free of dithering noise).
    {
      const W = 1040, H = 720;
      const { context: loginContext } = await newLoggedInPage(browser, { width: W, height: H, dsf: 1 });
      const storageState = await loginContext.storageState();
      await loginContext.close();

      const videoDir = mkdtempSync(path.join(os.tmpdir(), 'mylineup-gif-'));
      const context = await browser.newContext({
        viewport: { width: W, height: H },
        storageState,
        recordVideo: { dir: videoDir, size: { width: W, height: H } },
      });
      await context.addInitScript((expanded) => {
        localStorage.setItem('mylineup_theme', 'dark');
        localStorage.setItem('mylineup_date_format', 'DD-MM-YYYY');
        localStorage.setItem('mylineup_expanded_sports', expanded);
      }, EXPANDED);
      const t0 = Date.now();
      const page = await context.newPage();
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.locator('.team-groups').getByRole('heading', { name: RICH_FAVS[0].teamName }).first().waitFor({ timeout: 180000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      // Everything before this point is the page loading — trimmed off below.
      const start = (Date.now() - t0) / 1000;

      await page.waitForTimeout(1500);
      const scrollTo = async (selector, offset = 0) => {
        const target = await page.evaluate(
          ([sel, off]) => document.querySelector(sel).getBoundingClientRect().top + window.scrollY + off,
          [selector, offset]
        );
        // Ease in small wheel steps so the GIF reads as a scroll, not a jump.
        for (;;) {
          const y = await page.evaluate(() => window.scrollY);
          const remaining = target - y;
          if (Math.abs(remaining) < 6) break;
          await page.mouse.wheel(0, Math.sign(remaining) * Math.min(Math.abs(remaining), 40));
          await page.waitForTimeout(16);
        }
      };
      await scrollTo('.team-groups', -16);
      await page.waitForTimeout(2200);
      await scrollTo('.team-groups', 640);
      await page.waitForTimeout(2200);
      await scrollTo('.league-groups', -16);
      await page.waitForTimeout(2800);

      const video = page.video();
      await context.close();
      const webm = await video.path();
      try {
        execFileSync('ffmpeg', [
          '-y', '-loglevel', 'error', '-ss', String(start), '-i', webm,
          '-vf', 'fps=10,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
          path.join(OUT, 'demo.gif'),
        ]);
        console.log('demo.gif');
      } catch (e) {
        console.warn(`Skipping demo.gif — ffmpeg failed or is not installed (${e.message.split('\n')[0]})`);
      }
      rmSync(videoDir, { recursive: true, force: true });
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
