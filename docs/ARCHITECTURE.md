# Architecture

## Components

- `client/`: React single-page application built by Vite; React Router handles dashboard, issue, auth, and report pages. `AuthContext` restores the current user from the cookie-backed API session.
- `server/src/app.js`: Express app, Helmet headers, CORS, JSON parsing, cookie parsing, API routes, and centralized errors.
- `server/src/routes/`: authentication, issue workflows, and staff analytics endpoints.
- `server/src/middleware/auth.js`: JWT cookie authentication and staff authorization.
- `server/src/models/`: Mongoose `User` and `Issue` schemas. Activity entries are embedded in each issue so a status change and its history can be recorded together in one document update.
- `server/src/utils/`: pure priority formula and allowed status transitions.
- `scripts/setup-local.js`: private local config generation.

## Data flow

The browser calls `/api/v1` with `credentials: include`. During development Vite forwards `/api` to Express. Express verifies the session cookie, checks role where needed, validates the request, then reads or updates MongoDB through Mongoose. The server returns JSON; React renders server data and errors.

## Data model

`User` stores name, normalized unique email, password hash, and STUDENT or STAFF role. `Issue` stores report fields, creator, status, supporter user IDs, resolution reason, timestamps, and activity entries. Activity entries store type, message, actor, timestamp, and optional from/to status values. Indexes support unique email, creator lookups, and issue filters.

## Security and consistency

Passwords use bcrypt hashes. Sessions are signed, time-limited JWTs in HttpOnly, SameSite=Lax cookies (Secure in production). Staff identity is read from MongoDB on authenticated requests; request bodies cannot change roles. Issue status updates compare the current stored status before writing, preventing a stale concurrent update from silently winning. Support IDs use `$addToSet` and conditional queries to prevent duplicate support. Server-side validation and ownership checks protect data. Errors are returned without stack traces.

## Operational notes

Analytics are calculated from persisted issues and embedded activity. The app does not depend on external APIs. For cross-origin production hosting, use an HTTPS same-site reverse proxy and set `CLIENT_ORIGIN` to the exact frontend origin.
