# Deployment stack

*Last touched 2026-09-12.*

MyLineUp is deployed and live on a free-tier stack:
- **Client** (Vercel): https://my-line-up.vercel.app
- **Server** (Render): https://mylineup.onrender.com — free tier spins down after 15 min idle, so the first request after a gap has a ~30-60s cold-start delay
- **Database**: MongoDB Atlas free M0 cluster

**Why the deploy order matters:** CORS only allows one `CLIENT_URL` origin. Deploy Render first (to get its URL), set `VITE_API_URL` on Vercel to that, then go back and set `CLIENT_URL` on Render to the real Vercel URL — see the "☁️ Deployment" section in the repo's own `README.md` for the full runbook, which is kept current.

**Deploy gotcha:** `validateEnv.js` hard-requires `RESEND_API_KEY` in production (for the forgot-password email flow) — `server.js` calls `process.exit(1)` if it's missing. Before new code reaches Render, confirm `RESEND_API_KEY` (and optionally `EMAIL_FROM`) is set in Render's dashboard env vars, or the live server will crash-loop on deploy, taking the whole app down (not just password reset). The same is true of `INTERNAL_REFRESH_SECRET` (needed for the scheduled snapshot-refresh cron). `CRICKET_API_KEY` is different — it's *not* hard-required, so its absence degrades gracefully rather than crash-looping.

See `e2e-test-suite.md` in this same directory for a way to smoke-test this stack directly.
