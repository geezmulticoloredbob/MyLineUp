# Player Pages V1 rollout

*Last touched 2026-11-06.*

Player Pages (follow individual players, see their season stats) is one of the app's own Roadmap items, being shipped **league by league** — one small, independently live-verified PR per league, not all at once. This file is a snapshot of local project memory so a session on another device/machine has the same context; verify anything load-bearing against the actual code/PR history before trusting it as current.

**Shipped so far (2026-10-28 through 2026-11-06), ten PRs:**
- PR #73 — backend data layer: `PlayerFavourite` model, `server/src/services/espnPlayerService.js` (roster + per-player stats via ESPN's free athlete endpoints, no API key needed), `/api/players/*` routes, wired into `dashboardService.buildDashboard`'s response (`players`/`playerCount`).
- PR #74 — client UI: Teams/Players sub-tab inside Manage Favourites (team picker → live roster → follow/unfollow a player) and a `PlayerCard` on the dashboard. NFL pilot.
- PR #75 — NBA. PR #76 — NHL. PR #77 — MLB (its ESPN `/stats` splits into separate `career-batting`/`pitching` categories rather than one flat category — `zipLatestSeason`'s "take the last row" logic already handled this with no code change). PR #78 — WNBA.
- PR #79 — NWSL, the **first soccer league**. Soccer uses a different stats endpoint, `/overview` not `/stats` — confirmed real per-player numbers (not a placeholder shape).
- PR #80 — A-League. Some players have no ESPN headshot (`headshotUrl: null`) — confirmed this degrades gracefully to an empty string, nothing to fix.
- PR #81 — Liga MX. PR #82 — Brasileirão. Both matched the same flat-roster/`/overview`-stats shape as NWSL/A-League — no new quirks.

**Current allowlist** (`client/src/features/players/constants.js`'s `PLAYER_PAGES_LEAGUES`): `['NFL', 'NBA', 'NHL', 'MLB', 'WNBA', 'NWSL', 'ALEAGUE', 'LIGAMX', 'BRASILEIRAO']`.

**Remaining ESPN-routed leagues not yet shipped:** Argentina, Saudi PL, Primeira Liga, Turkey, Scotland, J1, Belgium, MLS — all soccer, and every soccer league checked so far (NWSL, A-League, Liga MX, Brasileirão) has matched the same flat-roster/`/overview`-stats shape, so this looks like a reliable pattern, but give each one its own quick live check before shipping rather than assuming. AFL and NRL are currently un-shippable (ESPN returns `athletes: []` for both — confirmed via the response's own `season.name` field showing their off-season; re-check once their season resumes, ~March). football-data.org-routed leagues (EPL, La Liga, Bundesliga, Serie A, Ligue 1, Championship, Eredivisie, UCL, World Cup) and cricket are a permanent gap — that provider has no full roster endpoint.

**Rollout checklist for the next league:**
1. Check the previous PR actually merged (`gh pr view <n> --json state,mergedAt`) — don't assume. Sync local master.
2. Pick the next unshipped league from the list above and its ESPN team id (see `client/src/data/teamsByLeague.js`).
3. Verify live: roster shape (flat vs grouped-by-`.items`) and stats endpoint shape, via `espnPlayerService.js`'s `getESPNRoster`/`getESPNPlayerData` directly (a scratch Node script works, no server needed) — check at least one player with real, non-zero stats, not just that the call succeeds.
4. If a local dev server + MongoDB are available, also run a live e2e round trip: login as a demo account (see `demo-accounts.md` in this same directory) → `GET /api/players/roster/:league/:teamId` → `POST /api/players/favourites` → `GET /api/dashboard` (confirm the hydrated player's stats) → `DELETE /api/players/favourites/:id` to clean up. Player favourites aren't gated by `followedLeagues` — any logged-in demo account works regardless of which leagues it follows. If no local server is available in this environment, the direct ESPN-service check in step 3 plus the full test suite is enough to ship confidently — note in the PR description that the live e2e round trip wasn't re-run in this session.
5. Add the league to `PLAYER_PAGES_LEAGUES`, add a matching `'shows a Teams/Players sub-tab for <League> too'` test in `client/src/__tests__/features/favourites/FavouritesManager.test.jsx` (check `LEAGUE_DISPLAY_NAMES` in `client/src/constants/leagues.js` for the exact button text — several leagues display differently from their key, e.g. A-League, Liga MX, Brasileirão), update that describe block's title, run `npm run test:run` in `client/`.
6. Ship as its own small PR, no server changes needed (the server already supports every ESPN-routed league generically).
7. Open the PR with `gh pr create`. Merging is a user decision — follow whatever this session's actual permission settings/prompts allow; if merging is blocked, leave the PR open and hand the link to the user rather than trying to work around the block.
8. Update this file (and, on the machine that has it, the local memory file `player-pages-v1.md`) with the new PR number and findings.

**Why:** the user is treating this as a real, portfolio-worthy feature build — shipped incrementally, each slice tested and live-verified against real data, not just "looks right in a mock."
