# 🏟 MyLineup (Working Name)

A personalised sports dashboard that lets users follow their favourite teams across multiple leagues in one unified interface — fixtures, results, ladders and stats, aggregated into a single feed.

## 📌 Overview

MyLineup is a full-stack MERN application (React + Vite on the client, Express + MongoDB on the server). Users register, pick the leagues and teams they follow, and land on a personalised dashboard that pulls live data from each league's sports API.

Core capabilities:

- Account registration/login with JWT authentication
- Guided onboarding to select followed leagues and favourite teams
- A personal dashboard aggregating, per favourite team:
  - Latest result and next fixture
  - Ladder / league table position
  - Season stats and top scorers
  - Team logo and brand colours (sourced from ESPN)
- A today's games feed showing live results and fixtures across followed leagues
- Drag-and-drop reordering of leagues and teams on the dashboard
- Dark/light theme, with an optional background tint derived from a chosen team's colours
- Account settings (update profile, password, and avatar icon) via an account menu

Supported leagues:

- NBA
- Premier League (EPL)
- AFL
- FIFA World Cup
- La Liga
- Bundesliga
- Serie A
- Ligue 1

## 🚀 Tech Stack

**Frontend**
- React 19 + Vite
- React Router
- Vitest + Testing Library

**Backend**
- Node.js + Express 5
- MongoDB (Mongoose ODM)
- JWT authentication (bcrypt-hashed passwords, rate-limited auth endpoints, Helmet + CORS)
- Jest + Supertest, with `mongodb-memory-server` for integration tests

**External data**
- BallDontLie API (NBA)
- football-data.org (EPL, La Liga, Bundesliga, Serie A, Ligue 1, World Cup)
- AFL data source
- ESPN CDN for team logos and brand colours

## 🧠 Core Features

### 1️⃣ Accounts & Onboarding
- Register / login with JWT-backed sessions
- Guided onboarding flow to pick followed leagues and favourite teams before reaching the dashboard
- Account menu for updating profile details, password, and avatar icon

### 2️⃣ Personal Dashboard
- Per-team cards showing latest result, next fixture, ladder position, and stats, hydrated live from each league's API (with graceful fallback if a source is unavailable)
- Today's games feed across all followed leagues
- Drag-and-drop reordering of leagues and teams, persisted per user

### 3️⃣ Favourites
- Add/remove favourite teams per league from the onboarding flow or dashboard
- Favourites drive both the dashboard cards and the games feed

### 4️⃣ Theming
- Dark theme by default, with a light theme toggle
- Optional dashboard background tint derived from a favourite team's brand colours

## 🗄 Data Models

**User**
- `username`, `email`, `password` (bcrypt-hashed)
- `followedLeagues[]` — one or more of `NBA`, `EPL`, `AFL`, `WC`, `LALIGA`, `BUNDESLIGA`, `SERIEA`, `LIGUE1`
- `onboardingComplete`
- `iconId` — selected avatar icon

**Favourite**
- `user` (ref), `league`, `teamId`, `teamName`, `teamLogoUrl`
- Unique index on `(user, league, teamId)`

Team IDs follow the pattern `{league}-{abbr}` (e.g. `nba-gsw`, `epl-ars`, `afl-haw`).

## 🔄 Data Flow

1. User logs in and completes onboarding (or lands on the dashboard if already onboarded)
2. Dashboard requests the user's favourites and followed leagues
3. The server's league services (NBA, AFL, football, World Cup) fetch and normalise data from each external API, with a 5-minute in-memory cache on standings
4. Results are aggregated into a single dashboard payload and rendered as league/team cards and a games feed on the client

## 📁 Project Structure

Monorepo with independent `client/` and `server/` apps (no shared packages).

```
client/src/
  components/   shared UI (account menu, protected routes, error boundary, layout)
  features/     feature modules — auth, dashboard, favourites
  pages/        route-level screens (login, register, onboarding, home)
  routes/       router setup
  contexts/     Auth, Theme, Favourites providers
  data/         static team/league reference data
  services/     API client

server/src/
  routes/       auth, league, favourites, dashboard
  controllers/  request handlers (wrapped in asyncHandler)
  services/     league integrations + dashboard aggregation
  models/       User, Favourite (Mongoose)
  middleware/   auth, error handling
  validators/   request payload validation
```

See `docs/project-structure.md` for more detail, and `CLAUDE.md` for architecture notes.

## 🛠 Local Development Setup

**Server**
```bash
cd server
npm install
npm run dev          # nodemon, http://localhost:5000
```

**Client**
```bash
cd client
npm install
npm run dev           # vite, http://localhost:5173
```

**Tests**
```bash
cd server && npm test         # jest
cd client && npm run test:run # vitest
```

### Environment variables

`server/.env` (gitignored):
```
MONGODB_URI=       # MongoDB Atlas connection string
JWT_SECRET=
PORT=5000
CLIENT_URL=http://localhost:5173
BASKETBALL_API_KEY=   # BallDontLie (NBA)
FOOTBALL_API_KEY=     # football-data.org
```

`client/.env` (gitignored):
```
VITE_API_URL=http://localhost:5000
```

## 🧩 Roadmap

- Player pages and player-level stats/favourites
- Video highlights integration
- Live match tracking
- Push notifications
- Mobile app (React Native, reusing the existing backend)
- Fantasy integration and social sharing

## 🎯 Vision

A single, personalised sports hub that eliminates the need to juggle multiple apps to keep up with favourite teams.
