# API reference

All routes are under `/api/v1`. JSON errors have the shape `{ "error": { "code": "...", "message": "..." } }`. Authenticated routes use the HttpOnly `campusfix_session` cookie.

| Method and path | Access | Purpose |
|---|---|---|
| `GET /health` | Public | API process health (does not verify MongoDB readiness independently) |
| `POST /auth/register` | Public, rate limited | Create a student account; body: `name`, `email`, `password` |
| `POST /auth/login` | Public, rate limited | Sign in; body: `email`, `password` |
| `POST /auth/logout` | Public | Clear the session cookie |
| `GET /auth/me` | Signed in | Restore the current user |
| `GET /issues` | Signed in | List issues; optional `scope=mine|community`, `category`, `severity`, `status`, `location`, `search`, `sort=priority` |
| `POST /issues` | Student/staff | Create a report with `title`, `description`, `category`, `location`, `severity` |
| `GET /issues/:id` | Signed in | Read issue details and activity history |
| `POST /issues/:id/support` | Signed in | Add one support (creator and duplicate support are rejected) |
| `DELETE /issues/:id/support` | Signed in | Remove current user's support |
| `PATCH /issues/:id/status` | Staff | Move to a valid next status; body: `status`, optional `comment`; rejection requires a reason |
| `POST /issues/:id/comments` | Staff | Add activity comment; body: `comment` |
| `GET /dashboard` | Staff | Data-derived metrics, category counts, recent reports, and high-priority open issues |

Valid categories: `PLUMBING`, `ELECTRICITY`, `INTERNET`, `CLEANLINESS`, `FURNITURE`, `SAFETY`, `OTHER`. Severity: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Status workflow: `SUBMITTED → UNDER_REVIEW → IN_PROGRESS → RESOLVED`; `REJECTED` is allowed only from `SUBMITTED` or `UNDER_REVIEW` and requires a reason. Terminal states cannot transition further.
