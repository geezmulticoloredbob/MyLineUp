# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Client (React + Vite)
```bash
cd client
npm run dev          # start dev server (localhost:5173)
npm run build        # production build
npm test             # vitest watch mode
npm run test:run     # vitest single run
```

### Server (Express + Node)
```bash
cd server
npm run dev          # nodemon watch (localhost:5000)
npm start            # production
npm test             # jest (all __tests__/**/*.test.js)
npm run test:watch   # jest watch
```

To run a single server test file:
```bash
cd server && npx jest src/__tests__/services/nbaService.test.js
```

## Architecture

Monorepo with `client/` and `server/` — no shared packages between them.

### Server
- **Entry**: `src/server.js` → `src/app.js` (Express app exported separately for testing)
- **Request flow**: routes → controllers → services → models
- **All controllers** are wrapped with `asyncHandler` (no try/catch needed in controllers)
- **Errors** thrown as `new ApiError(statusCode, message)` — caught by `errorHandler` middleware
- **Auth middleware** (`middleware/authMiddleware.js`): httpOnly `token` cookie → DB user lookup → `req.user`
- **Password reset**: `POST /api/auth/forgot-password` (always responds identically whether or not the email exists, to avoid enumeration) generates a random token, stores its SHA-256 hash + a 30min expiry on the `User`, and emails a `{CLIENT_URL}/reset-password/{rawToken}` link via `utils/email.js` (Resend). `POST /api/auth/reset-password/:token` re-hashes the token to look up the user and checks expiry. Without `RESEND_API_KEY` set, `utils/email.js` logs the reset link to the server console instead of emailing it — fine for local dev, but `validateEnv.js` requires the key in production so this doesn't silently no-op there.
- **Config**: all env vars centralised in `config/env.js`; never read `process.env` directly elsewhere
- **Sports data**: league services (`nbaService`, `footballService`, `worldCupService`, `espnTeamSportService`) are orchestrated by `sportsDataService.hydrateTeam()`. `espnTeamSportService` is a single config-driven service covering NFL/NHL/MLB/AFL/NRL/WNBA/NWSL/ALEAGUE/LIGAMX/BRASILEIRAO/ARGENTINA/SAUDIPL/PRIMEIRALIGA/TURKEY/SCOTLAND via ESPN's public site API (no key required) — AFL used to go through its own Squiggle-based `aflService`, migrated to ESPN after Squiggle proved rate-limit-prone in production. Each service returns `{ logoUrl, latestResult, nextFixture, ladderPosition, stats, topScorers }` or throws. On error, `sportsDataService` falls back to `source: 'unavailable'` rather than failing the whole request. `leagueService.js` holds the equivalent per-league dispatch table (`standings`/`games`) for the today's-games feed and league overview.
  - **NRL is addressed by a numeric league id (`3`)** on ESPN's site API rather than a friendly name — undocumented by ESPN, confirmed against the live API.
  - **NRL and every soccer league added after it (NWSL, A-League, Liga MX, Brasileirão, Argentina, Saudi PL, Primeira Liga) are all logo-keyed by the team's numeric ESPN id** rather than by abbreviation under the league's own name (`cdnLogoUrl()`'s `LOGO_ID_PATH_OVERRIDES`) — confirmed against real API responses, not ESPN's docs. NRL's path is `teamlogos/rugby/teams/`; the soccer leagues share the generic `teamlogos/soccer/` bucket EPL/La Liga/etc. use for their own separately-tracked numeric-id map (`EPL_ESPN_IDS` in `sportsDataService.js`).
  - **Argentina's roster has two clubs ESPN itself labels with the identical abbreviation "RIV"** (Independiente Rivadavia and River Plate) — see `client/src/data/teamsByLeague.js`'s `ARGENTINA` block and the "River Plate vs Independiente Rivadavia" test suite in `espnTeamSportService.test.js` for how that's disambiguated (deliberately routing one team through abbreviation matching and the other through the name-based fallback, chosen per-team based on which path is actually safe for that specific name).
  - **`findTeamByName()` checks every team for an exact name match before ever trying a fuzzy substring one.** This matters beyond Argentina: Scotland has two clubs sharing the abbreviation "DUN" (Dundee, Dundee United) with no abbreviation-only escape hatch available (unlike River Plate's case — any "DUN"-equal abbreviation resolves to whichever team ESPN lists first, regardless of which is meant), and "Dundee" is a genuine substring of "Dundee United"'s own name. A naive fuzzy-first search would silently resolve "Dundee United" to plain "Dundee". Exact-match-first fixes this generally, not just for Scotland.
  - **`fetchESPNScoreboard()` sends no `dates` query param at all**, for every league. It used to send a `?dates=YYYYMMDD-YYYYMMDD` range for a ±7-day window, but as of 2026-09-17 ESPN 400s ("Failed to get events endpoint") on that range for every league checked (NFL/AFL/NHL/MLB/NRL) — appears to be an ESPN-side change/outage, not a per-league quirk. Omitting the param entirely still works and gives ESPN's own "current games" window instead. Revisit if ESPN restores range support — check before assuming this is still needed.
  - **NRL has no ESPN colour data** (`color`/`alternateColor` fields are absent from its team objects) — unlike every other ESPN-routed league, it's excluded from `espnColourService.js`'s `ESPN_LEAGUE_URLS`, so `client/src/data/teamColors.js`'s NRL entries are its *only* colour source, not just a fallback.
- **Cricket (IPL, BBL) is the one league family not on ESPN at all** — ESPN's site API has no cricket data whatsoever (confirmed via its core API's league list, genuinely empty). `services/cricketService.js` talks to cricketdata.org (formerly CricAPI) instead, a **separate provider with its own API key** (`CRICKET_API_KEY`) and a free tier hard-capped at 100 requests/day — nothing like ESPN's effectively-unlimited free tier, so its two caches (`series_info`, `series_points`) use much longer TTLs (3h vs ESPN's 5min standings). Structural differences from every ESPN-routed league:
  - **No stable per-league id.** "IPL" only exists as "Indian Premier League 2026", a different UUID each season (found via `/series?search=`) — `SERIES_IDS` in `cricketService.js` needs manually refreshing once a year when a new season's series is created; there's no cheap way to auto-discover "this year's IPL" without burning an extra call against the daily budget on every request.
  - **No numeric score.** The match list only gives a human-readable result string ("Chennai Super Kings won by 23 runs"), not per-team run totals — getting real numbers would need one extra API call per match. `getCricketTeamData()`'s `latestResult.score` uses that status string directly (cricket's own convention is to describe a result by margin, not a scoreline anyway); `getCricketLeagueGames()` deliberately always returns empty `recentResults`/`upcomingFixtures` rather than forcing something misleading into the numeric `homeScore`/`awayScore` fields `LeagueCard.jsx` compares directly to highlight a winner.
  - **No live colour data at all** (like NRL) — `client/src/data/teamColors.js`'s `ipl-`/`bbl-` entries are each team's only colour source.
  - **Real logo URLs come directly from the API response** (`team.img`) — no CDN URL construction needed, unlike every ESPN-routed league.
- **Caching**: each league service caches in-memory with a TTL + in-flight-promise dedup, so concurrent/repeated requests share one external call: team lists 24h, standings 5min, scorers 1h, and (per-team and per-league) match/game fetches 5min. Several external APIs (football-data.org, Squiggle) also enforce a per-minute rate limit on the whole key/IP rather than per-request — `utils/requestThrottle.js` queues calls to the same bucket with a minimum spacing, so a burst of parallel favourites doesn't blow through it even though each call is already cached/deduped on its own.
- **Team IDs** follow the pattern `{league}-{abbr}` (e.g. `nba-gsw`, `epl-ars`, `afl-haw`)
- **Integration tests** use `mongodb-memory-server` (see `__tests__/integration/dbSetup.js`); unit tests mock the DB
- **Snapshot history**: `services/snapshotService.js` hydrates every distinct favourited team (via the same `sportsDataService.hydrateFavouriteTeams()` the live dashboard uses) and upserts one `TeamSnapshot` row per team per UTC day, keyed on `(league, teamId, capturedOn)`. `GET /api/dashboard/trend/:league/:teamId` reads that history back. It's triggered by `POST /api/internal/refresh-snapshots`, authenticated via a `x-internal-secret` header (`middleware/internalAuthMiddleware.js`, timing-safe compare) rather than a user cookie — there's no logged-in user in the [GitHub Actions cron](.github/workflows/refresh-snapshots.yml) that calls it daily. Runs from GitHub Actions rather than an in-process scheduler because Render's free tier sleeps the server after 15min idle. `internalController.refreshSnapshots` responds `202` immediately and runs `captureSnapshots()` in the background (deliberately not awaited, logged via `console.log`/`console.error` rather than returned) — a full run across every favourited team can take minutes given football-data.org's shared per-minute rate limit across 8 leagues, which would otherwise exceed Render's proxy timeout on a held-open request.

### Client
- **Entry**: `src/main.jsx` → `src/App.jsx` → `src/routes/AppRouter.jsx`
- **Context stack** (outermost → innermost): `ErrorBoundary` → `ThemeProvider` → `AuthProvider` → `FavouritesProvider`
- **Auth**: JWT lives in an httpOnly cookie set by the server (not accessible to client JS); `AuthContext` manages user state; `apiClient.js` sends `credentials: 'include'` on every request so the cookie goes along automatically — there's no client-side token to store or inject
- **ProtectedRoute**: unauthenticated → `/login`; authenticated but `onboardingComplete: false` → `/onboarding`; `forOnboarding` prop inverts this (lets through non-onboarded users only)
- **Dashboard refresh**: `FavouritesContext` exposes `triggerRefresh()` which bumps a `refreshTick`; `HomePage` re-fetches when tick changes
- **Theme**: `ThemeProvider` stores `data-theme` attribute on `<html>` and persists to `localStorage` (`mylineup_theme`, `mylineup_bg_team`, `mylineup_bg_team_name`, `mylineup_date_format`, `mylineup_league_order`, `mylineup_team_order`, `mylineup_expanded_sports`)
- **Static data**: `client/src/data/teamsByLeague.js` is the source of truth for team rosters; `client/src/data/teamColors.js` maps team IDs to brand colours
- **Styles**: single CSS file at `client/src/styles/index.css` using CSS custom properties; dark theme by default; fonts are Oswald (headings) and Jost (body)

### Data models
- **User**: `username`, `email`, `password` (bcrypt), `followedLeagues[]` (enum imported from `constants/leagues.js` — `'NBA'|'EPL'|'AFL'|'WC'|'LALIGA'|'BUNDESLIGA'|'SERIEA'|'LIGUE1'|'CHAMPIONSHIP'|'EREDIVISIE'|'UCL'|'NFL'|'NHL'|'MLB'|'NRL'|'WNBA'|'NWSL'|'ALEAGUE'|'LIGAMX'|'BRASILEIRAO'|'ARGENTINA'|'SAUDIPL'|'PRIMEIRALIGA'|'TURKEY'|'SCOTLAND'|'IPL'|'BBL'`), `onboardingComplete`, `iconId` (account icon, defaults to `'football'`), `passwordResetTokenHash`/`passwordResetExpires` (set by the forgot-password flow, cleared on use)
- **Favourite**: `user` (ref), `league`, `teamId`, `teamName`, `teamLogoUrl`; unique index on `(user, league, teamId)`
- **TeamSnapshot**: `league`, `teamId`, `teamName`, `capturedOn` ('YYYY-MM-DD' UTC), `latestResult`, `ladderPosition`, `stats`; unique index on `(league, teamId, capturedOn)`. One row per followed team per day — see Snapshot history above

### ESPN logo URLs
`sportsDataService.espnLogoFromTeamId()` maps team IDs to ESPN CDN URLs as a last-resort fallback for when the primary sport service returns no logo at all. NBA uses abbreviation-based paths (with `NBA_ESPN_OVERRIDES` for the ones that differ from ESPN's); EPL uses numeric IDs (see `EPL_ESPN_IDS` map in that file); WNBA uses abbreviation-based paths like NBA (our stored `wnba-` abbreviations were deliberately chosen to match ESPN's own). AFL and NRL aren't handled here — our stored `afl-`/`nrl-` abbreviations were invented locally and never verified against ESPN's actual scheme (and NRL's real CDN scheme is id-keyed anyway, which this abbreviation-only function has no way to construct), so `espnTeamSportService.cdnLogoUrl()` builds their logo URLs from ESPN's own team data instead (found via a name-based fallback match when our abbreviation doesn't line up with theirs — see `findTeamByName` in that file).

## Env vars

**`server/.env`** (gitignored):
```
MONGODB_URI=       # MongoDB Atlas connection string
JWT_SECRET=
PORT=5000
CLIENT_URL=http://localhost:5173
BASKETBALL_API_KEY=   # BallDontLie (NBA)
FOOTBALL_API_KEY=     # football-data.org (EPL)
CRICKET_API_KEY=      # cricketdata.org — free tier, 100 req/day; powers IPL and BBL only
RESEND_API_KEY=       # resend.com — required in production for password-reset emails
EMAIL_FROM=           # optional, defaults to Resend's shared onboarding@resend.dev sender
INTERNAL_REFRESH_SECRET=  # required in production — must match the GitHub Actions repo secret of the same name
```

**`client/.env`** (gitignored):
```
VITE_API_URL=http://localhost:5000
```
