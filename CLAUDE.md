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
- **Auth middleware** (`middleware/authMiddleware.js`): Bearer token → DB user lookup → `req.user`
- **Config**: all env vars centralised in `config/env.js`; never read `process.env` directly elsewhere
- **Sports data**: league services (`nbaService`, `aflService`, `footballService`, `worldCupService`, `espnTeamSportService`) are orchestrated by `sportsDataService.hydrateTeam()`. `espnTeamSportService` is a single config-driven service covering NFL/NHL/MLB via ESPN's public site API (no key required). Each service returns `{ logoUrl, latestResult, nextFixture, ladderPosition, stats, topScorers }` or throws. On error, `sportsDataService` falls back to `source: 'unavailable'` rather than failing the whole request. `leagueService.js` holds the equivalent per-league dispatch table (`standings`/`games`) for the today's-games feed and league overview.
- **Caching**: standings responses have a 5-min in-memory TTL inside each league service
- **Team IDs** follow the pattern `{league}-{abbr}` (e.g. `nba-gsw`, `epl-ars`, `afl-haw`)
- **Integration tests** use `mongodb-memory-server` (see `__tests__/integration/dbSetup.js`); unit tests mock the DB

### Client
- **Entry**: `src/main.jsx` → `src/App.jsx` → `src/routes/AppRouter.jsx`
- **Context stack** (outermost → innermost): `ErrorBoundary` → `ThemeProvider` → `AuthProvider` → `FavouritesProvider`
- **Auth**: JWT stored in `localStorage`; `AuthContext` manages user state; `apiClient.js` injects the Bearer token on every request
- **ProtectedRoute**: unauthenticated → `/login`; authenticated but `onboardingComplete: false` → `/onboarding`; `forOnboarding` prop inverts this (lets through non-onboarded users only)
- **Dashboard refresh**: `FavouritesContext` exposes `triggerRefresh()` which bumps a `refreshTick`; `HomePage` re-fetches when tick changes
- **Theme**: `ThemeProvider` stores `data-theme` attribute on `<html>` and persists to `localStorage` (`mylineup_theme`, `mylineup_bg_team`)
- **Static data**: `client/src/data/teamsByLeague.js` is the source of truth for team rosters; `client/src/data/teamColors.js` maps team IDs to brand colours
- **Styles**: single CSS file at `client/src/styles/index.css` using CSS custom properties; dark theme by default; fonts are Oswald (headings) and Jost (body)

### Data models
- **User**: `username`, `email`, `password` (bcrypt), `followedLeagues[]` (`'NBA'|'EPL'|'AFL'`), `onboardingComplete`
- **Favourite**: `user` (ref), `league`, `teamId`, `teamName`, `teamLogoUrl`; unique index on `(user, league, teamId)`

### ESPN logo URLs
`sportsDataService.espnLogoFromTeamId()` maps team IDs to ESPN CDN URLs. NBA and AFL use abbreviation-based paths; EPL uses numeric IDs (see `EPL_ESPN_IDS` map in that file). Some NBA abbreviations differ from ESPN's — see `NBA_ESPN_OVERRIDES`.

## Env vars

**`server/.env`** (gitignored):
```
MONGODB_URI=       # MongoDB Atlas connection string
JWT_SECRET=
PORT=5000
CLIENT_URL=http://localhost:5173
BASKETBALL_API_KEY=   # BallDontLie (NBA)
FOOTBALL_API_KEY=     # football-data.org (EPL)
```

**`client/.env`** (gitignored):
```
VITE_API_URL=http://localhost:5000
```
