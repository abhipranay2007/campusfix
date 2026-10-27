# CampusFix

CampusFix is a campus issue reporting and resolution platform. Students can report maintenance problems, follow progress, and support reports that affect them. Campus staff can review a prioritized queue, update issue status, leave an audit trail, and see operational metrics.

## Problem and users

Campus problems are often reported in informal channels and are hard to track. CampusFix gives students one place to submit and follow issues and gives authorized staff a shared queue for triage and resolution. Its main users are students and campus operations staff.

## Features

- Student registration, secure login, logout, and browser session restoration.
- Student issue reports with title, details, category, building/location, and severity.
- Private student report list plus a community issue list with one-person, one-support behavior.
- Staff-only triage, search/filter, priority ranking, controlled status changes, rejection reasons, and comments.
- Activity history that records the actor, timestamp, and status changes.
- Analytics calculated from MongoDB records, including category counts, open/resolved totals, resolution time, and high-priority issues.
- Responsive React interface with loading, empty, and error states.

## Technology and architecture

- MongoDB and Mongoose store users, issues, supporters, and embedded activity entries.
- Express exposes the `/api/v1` JSON API.
- React and Vite provide the browser application.
- Node.js runs the API and local setup scripts.

The request flow is React form → same-origin `/api` proxy in development → Express route and authorization middleware → Mongoose model → MongoDB → JSON response → React view. Passwords are hashed with bcrypt. Browser sessions use signed JWTs in HttpOnly cookies. Public registration always assigns the student role; staff accounts are made with a local CLI command.

## Prerequisites

- Node.js 20 or newer and npm.
- MongoDB running locally, or a MongoDB connection URL you are authorized to use.
- Docker is optional; it was not available in the implementation environment.

## Local setup

From the project root:

```sh
npm install
npm run setup
```

`npm run setup` creates a private, Git-ignored `.env` with a fresh random local JWT secret. It never overwrites an existing `.env`. Edit `MONGODB_URI` in `.env` if your MongoDB uses another address or database. The default is `mongodb://127.0.0.1:27017/campusfix`.

Start both development servers:

```sh
npm run dev
```

Open the Vite address printed in the terminal (normally [http://localhost:5173](http://localhost:5173); if that port is occupied, Vite selects the next available one). The API runs on port 4000 and the Vite development server proxies `/api` requests to it. To run the processes separately, use `npm run dev:server` and `npm run dev:client`.

Create the first staff account in a terminal:

```sh
npm run staff:create
```

The command prompts for name, email, and a password. It does not create a default staff password. Public registration cannot grant the staff role.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API listen port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/campusfix` |
| `JWT_SECRET` | Signing key for browser sessions | Generate privately with `npm run setup` |
| `CLIENT_ORIGIN` | Browser origin permitted by CORS | `http://localhost:5173` |
| `NODE_ENV` | Runtime mode | `development` |

The implemented product uses no third-party API keys. Production mode refuses to start if `JWT_SECRET` is missing or shorter than 32 characters. Keep `.env` private and out of Git.

## Priority formula

`score = severity × 10 + min(unique supporters, 10) × 2 + min(unresolved age in days, 30) × 0.5`

Severity maps LOW/MEDIUM/HIGH/CRITICAL to 1/2/3/4. Age contribution is zero for resolved or rejected issues. Bands are LOW below 20, MEDIUM from 20, HIGH from 35, and URGENT from 50. The inputs are stored issue fields; the score is calculated at read time and works offline.

## Testing and production build

```sh
npm test
npm run test:acceptance
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for test coverage and verification instructions. Integration checks should use a separate test database URI.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API_REFERENCE.md)
- [Testing](docs/TESTING.md)
- [Engineering decisions](docs/DECISIONS.md)
- [Viva preparation](docs/VIVA_PREP.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Acceptance checklist](docs/ACCEPTANCE_CHECKLIST.md)

## Deployment preparation

Build the frontend with `npm run build`. Set `NODE_ENV=production`, a unique `JWT_SECRET` of at least 32 characters, a production `MONGODB_URI`, `PORT`, and the deployed frontend origin in `CLIENT_ORIGIN`. Deploy the `client/dist` static files and Express API behind HTTPS and configure a same-site reverse proxy so browser cookies remain HttpOnly and same-site. No deployment has been performed; this repository does not yet have a live URL. Verify the deployed client, API, and database before submission.

## Known limitations and submission work

- No public deployment, GitHub remote, or demo video has been created.
- The current local setup expects a MongoDB service; Docker was unavailable here.
- Assignment-to-staff and image uploads are intentionally outside this first complete workflow.
- The local CLI prompt displays typed characters; run it in a private terminal.
- Before final submission, create an accessible repository/deployment/demo and submit the required form yourself.
