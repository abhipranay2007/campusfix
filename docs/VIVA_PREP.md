# Viva preparation

## Explain the stack simply

- **MongoDB** stores CampusFix records as documents.
- **Express** defines the backend URLs and decides what each request may do.
- **React** renders the screens and responds to user actions.
- **Node.js** runs Express and the JavaScript setup scripts.
- **Mongoose** defines the shape and constraints of MongoDB documents.

## Follow one report

A student fills the React report form. The browser sends JSON to Express. Authentication middleware reads the HttpOnly cookie and looks up the account. The route validates the fields, creates an Issue document through Mongoose, and saves the initial activity event. MongoDB persists it. Express returns JSON, and React opens the issue detail page.

## Models, routes, controllers, middleware

A model describes stored data. A route connects a URL and method to code. Middleware runs before that code: the authentication middleware checks identity, and staff middleware checks the role. The route performs validation and the database operation, then returns a response. This project keeps handlers in route modules to avoid abstractions that would obscure a small app.

## Authentication and roles

Passwords are hashed with bcrypt before storage. Successful login creates a signed, expiring JWT stored in an HttpOnly cookie. On protected requests, the server verifies the cookie and reloads the account from MongoDB. Staff-only routes inspect the database role; React route guards only improve navigation and are not the security boundary. Public signup always creates STUDENT accounts.

## Priority score

`severity × 10 + min(supporters, 10) × 2 + min(unresolved days, 30) × 0.5`. Severity maps to 1–4. A severe issue gets a higher score immediately; up to ten supporters add up to twenty points; unresolved time contributes up to fifteen. Resolved/rejected issues stop accumulating age points. Scores are computed from the stored report at read time.

## Status and history

The server permits only SUBMITTED→UNDER_REVIEW/REJECTED, UNDER_REVIEW→IN_PROGRESS/REJECTED, and IN_PROGRESS→RESOLVED. Terminal statuses cannot move again. Every accepted change records the staff actor, old and new status, time, and comment/reason in the issue activity array. A compare-on-current-status update handles concurrent changes safely.

## Security and trade-offs

Passwords are hashed; cookies are HttpOnly and SameSite; production cookies are Secure; login/register have rate limits; Helmet adds headers; CORS is restricted to the configured origin; inputs are checked on both sides; staff actions are checked by the API. A same-site production proxy keeps cookie behavior straightforward. This first version omits uploads, assignment, and external notifications to keep the main workflows complete and explainable.

## Demo and reproduction

Use `npm run setup`, start MongoDB, then `npm run dev`. Create a staff account with `npm run staff:create`. The demo script in `docs/DEMO_SCRIPT.md` follows the student report and staff resolution journey. Run `npm test` and `npm run build` to repeat unit and production build checks.
