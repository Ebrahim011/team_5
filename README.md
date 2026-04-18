# Class-track Projects

Full-stack application for managing classes: students, sessions, attendance (including QR scanning), grades, finance, messaging, reports, and admin workflows. This repository is a **monorepo** with a Node.js API and a Next.js web app.

## Repository layout

| Path                       | Description                                |
| -------------------------- | ------------------------------------------ |
| [`Backend/`](./Backend/)   | Express + MongoDB REST API (MVC)           |
| [`Frontend/`](./Frontend/) | Next.js (App Router) dashboard and portals |

## Tech stack

- **Backend:** Node.js 18+, Express, Mongoose, JWT, bcrypt, Nodemailer, Helmet, CORS
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, PWA (offline-oriented features), Axios

## Prerequisites

- [Node.js](https://nodejs.org/) **18 or newer**
- [MongoDB](https://www.mongodb.com/) (local instance or [Atlas](https://www.mongodb.com/cloud/atlas))

## Quick start (local)

### 1. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` with at least:

- `MONGODB_URI` — connection string (defaults to `mongodb://localhost:27017/class_track_db` if unset in development)
- `JWT_SECRET` — secret for signing tokens (required in production)
- `PORT` — optional; default **5000**

Start the API:

```bash
npm run dev
```

API base URL for local use: `http://localhost:5000/api`.

More detail: [Backend/README.md](./Backend/README.md) (endpoints, security).

### 2. Frontend

In a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

By default in development the UI talks to `http://localhost:5000/api`. To point the dev app at a remote API, set `NEXT_PUBLIC_USE_REMOTE_API=true` and `NEXT_PUBLIC_API_URL` (see [Frontend/README.md](./Frontend/README.md) and `Frontend/src/lib/constants.ts`).

For production builds, set `NEXT_PUBLIC_API_URL` to your deployed API origin (including `/api` path as used by the app).

## Docker

Each app has its own `Dockerfile` (`Backend/Dockerfile`, `Frontend/Dockerfile`). Build and run them separately, passing the same environment variables you would use on bare metal. There is no root `docker-compose` file in this repo; compose one locally if you want a single command to run both services and MongoDB.

## Documentation pointers

- Backend CORS: [Backend/CORS_SETUP.md](./Backend/CORS_SETUP.md)
- Backend on Vercel: [Backend/VERCEL_SETUP.md](./Backend/VERCEL_SETUP.md)
- Frontend on Vercel: [Frontend/VERCEL_DEPLOYMENT.md](./Frontend/VERCEL_DEPLOYMENT.md)

## License

See package metadata in `Backend/package.json` and `Frontend/package.json` (project-specific license terms may differ per package).
