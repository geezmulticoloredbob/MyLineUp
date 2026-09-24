# E2E test suite

*Last touched 2026-09-08.*

`e2e/` is a Playwright suite (separate `package.json`, not part of the `client`/`server` monorepo apps) that tests the actual **live deployed** app — see `deployment-stack.md` in this same directory — rather than a local dev server. Deliberately not wired into the GitHub Actions CI workflow (`.github/workflows/ci.yml`): it depends on Render's cold start and real third-party sports APIs, which would make CI flaky/slow on every PR. Run manually: `cd e2e && npm run test:e2e`.

Uses a dedicated test account (not the user's real one) — credentials live in `e2e/.env` (gitignored, not `e2e/.env.example`). `e2e/setup-test-account.js` is idempotent and (re)creates it: registers if missing else logs in, sets followed leagues to NBA+EPL, favourites Boston Celtics (NBA), marks onboarding complete. Re-run it any time the test account's state needs resetting.

**How to apply:** if asked to verify a production change actually works, this suite (or the same manual `curl`/Playwright-against-the-live-URL approach used to build it) is the way to check — don't assume unit tests alone prove a live-stack issue is fixed. See `e2e/README.md` for full details.
