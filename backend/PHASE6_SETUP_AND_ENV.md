# Phase 6 Setup and Environment Guide

Last verified: 2026-04-17
Scope: Backend and frontend local setup for collaborator pull-and-run.

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm 9+
- MongoDB local instance (MongoDB Compass + local server) on `127.0.0.1:27017`
- Git

## Required Environment Variables (`backend/.env`)

Create `backend/.env` from `backend/.env.example` and set values as needed.

- `NODE_ENV`: Runtime mode. Use `development` locally.
- `PORT`: Backend port. Default `5000`.
- `CLIENT_ORIGIN`: Frontend origin for CORS. Default `http://localhost:5173`.
- `MONGO_URI`: MongoDB connection string. Default `mongodb://127.0.0.1:27017/healthmonitorpro`.
- `JWT_ACCESS_PRIVATE_KEY`: Access token secret for dev/test.
- `JWT_REFRESH_PRIVATE_KEY`: Refresh token secret for dev/test.
- `AWS_ACCESS_KEY_ID`: Optional for S3 upload flows.
- `AWS_SECRET_ACCESS_KEY`: Optional for S3 upload flows.
- `AWS_REGION`: Optional for S3 upload flows.
- `AWS_S3_BUCKET`: Optional for S3 upload flows.
- `SENDGRID_API_KEY`: Optional for email flows.
- `FROM_EMAIL`: Optional sender email for notifications.

## Zero-to-Running (Fresh Clone)

### 1) Clone and install

```powershell
git clone <repo-url>
cd health-monitoring-dashboard
cd backend
npm ci
cd ..\frontend
npm ci
```

### 2) Configure backend env

```powershell
cd ..\backend
Copy-Item .env.example .env
```

Then edit `.env` if you need custom values.

### 3) Initialize and seed database

```powershell
npm run db:init
npm run db:seed
```

### 4) Start backend and frontend

Backend terminal:

```powershell
cd backend
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm run dev
```

### 5) Quick role login checks

- `admin@healthmonitorpro.local / Admin@123`
- `doctor@healthmonitorpro.local / Doctor@123`
- `patient@healthmonitorpro.local / Patient@123`

## Automated Validation Commands

From `backend`:

```powershell
npm run test:unit
npm run test:integration
npm run test:ci
```

- `test:unit`: Risk engine + auth service unit tests.
- `test:integration`: Phase 1-5 API and realtime integration tests.
- `test:ci`: CI-style script that ensures backend availability, runs `db:init`, then unit + integration tests.

## Fresh Clone Verification Result (Phase 6)

The following sequence was verified in this phase:

1. Dependency installation (`npm install` / `npm ci` compatible).
2. `npm run db:init` succeeded.
3. Full backend test suite (unit + phases 1-5 integration) passed.
4. Frontend production build passed.

This confirms collaborator pull-and-run readiness with documented steps.
