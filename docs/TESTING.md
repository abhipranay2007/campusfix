# Testing

## Automated checks

Run `npm test` for deterministic unit checks of the priority formula and status transition rules. Run `npm run build` for the Vite production build. Run `npm run test:acceptance` while MongoDB is running for a full isolated API journey. It creates a uniquely named database, verifies authentication/support/staff/status/analytics/persistence behavior, and drops only that generated test database afterward. Set `CAMPUSFIX_TEST_MONGODB_URI` to use a dedicated test MongoDB server; otherwise the app's local `MONGODB_URI` is used as the server address with a temporary database name.

## API and browser acceptance journey

Use an isolated MongoDB database for manual or integration checks. Do not clear the regular `campusfix` database to run tests.

1. Register a student and confirm the session restores after refresh.
2. Submit an issue and confirm the returned detail page and activity entry.
3. Create a second student; support the first student's issue, submit duplicate support and verify it is rejected, then remove support.
4. Call `/api/v1/dashboard` as a student and confirm `403`. As staff, filter by category, location, severity, and status.
5. Create staff with `npm run staff:create`; sign in and inspect the queue and dashboard.
6. Move the report through UNDER_REVIEW, IN_PROGRESS, and RESOLVED, checking each activity event. Try a skipped or reverse transition and expect `409`.
7. Submit invalid fields and identifiers and confirm `400`; request a missing issue and confirm `404`.
8. Restart the API and confirm the issue remains in MongoDB.

The integration journey requires a running MongoDB and browser; do not report it as passed unless executed in that environment. The implementation agent should report actual run results in its final summary.
