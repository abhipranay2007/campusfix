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

## Deployment: Render + MongoDB Atlas

**Live application:** [https://campusfix-7eff.onrender.com](https://campusfix-7eff.onrender.com)  
**Health check:** [https://campusfix-7eff.onrender.com/api/v1/health](https://campusfix-7eff.onrender.com/api/v1/health) — returns `{"status":"ok"}`.

The live deployment uses one Render Node web service in Singapore. Express serves the production React build and `/api/v1` from the same HTTPS origin, keeping the HttpOnly login cookie same-site. MongoDB Atlas hosts the database on a Free (M0) cluster in Mumbai.

The production configuration is:

- Repository: [github.com/abhipranay2007/campusfix](https://github.com/abhipranay2007/campusfix), branch `main`.
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/api/v1/health`
- Atlas network access: Render Singapore outbound ranges `74.220.52.0/24` and `74.220.60.0/24`.
- The Atlas application user is restricted to `readWrite` on the `campusfix` database and the `campusfix` cluster.

These environment variables are configured in Render; secret values are not stored in Git:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Private Atlas application connection string for the `campusfix` database |
   | `JWT_SECRET` | Private random signing secret (at least 32 characters) |
   | `CLIENT_ORIGIN` | `https://campusfix-7eff.onrender.com` |

Render supplies `PORT` to the app. To reproduce this setup, connect the public repository to a free Render web service, create a free Atlas M0 cluster, add the service's current outbound CIDRs to Atlas Network Access, and enter production secrets directly in Render's environment settings. Never put secret values in this repository.

Render's free web services sleep after inactivity and wake on the next request, so the first page load may take longer. Atlas Free clusters are intended for small-scale development and learning use. See [Render's Express deploy guide](https://render.com/docs/deploy-node-express-app), [Render's Atlas connection guide](https://render.com/docs/connect-to-mongodb-atlas), and [Atlas Free cluster setup](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) for current provider steps and limits.

## Known limitations and submission work

- The deployed site is live, but no production staff account has been provisioned. Use the private `npm run staff:create` flow to create the first staff user; do not expose the database URI or staff password in Git.
- The required 3–5 minute demo video and official submission form are still outstanding. The published deadline was 27 October 2026, 11:59 PM IST, which has passed.
- The current local setup expects a MongoDB service; Docker was unavailable here.
- Assignment-to-staff and image uploads are intentionally outside this first complete workflow.
- The local CLI prompt displays typed characters; run it in a private terminal.
- The official form requires the student's name and an accessible demo-video link in addition to the project, repository, deployment, stack, and feature details.
