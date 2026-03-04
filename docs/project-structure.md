# MyLineup Project Structure

This project uses a split frontend/backend layout:

- `client/` contains the React application.
- `server/` contains the Express API.
- `docs/` contains project notes you can discuss in your portfolio.

## Frontend

- `src/components/` shared UI pieces used across pages.
- `src/features/` feature-based code such as auth, dashboard, and favourites.
- `src/layouts/` page shells that control consistent page framing.
- `src/pages/` route-level screens.
- `src/routes/` router setup.
- `src/services/` shared API client code.
- `src/styles/` global styling.
- `src/utils/` small helper functions.

## Backend

- `src/config/` environment and database setup.
- `src/controllers/` request handlers.
- `src/middleware/` reusable Express middleware.
- `src/models/` Mongoose schemas.
- `src/routes/` API route definitions.
- `src/services/` business logic and external sports API integration.
- `src/utils/` general server helpers.
- `src/validators/` request validation rules.

This structure is intentionally larger than the current implementation so the app can grow into it without major refactors.

