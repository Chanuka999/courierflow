# CourierFlow

CourierFlow is a MERN-based courier management system starter.

## What is Included

- Backend API with JWT auth and role-based authorization.
- Parcel create, track, assign rider, and status update workflows.
- Parcel status audit logs.
- Dashboard metrics endpoint.
- React frontend with login, dashboard, parcel creation, and customer tracking pages.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose.
- Frontend: React + Vite.

## Project Structure

- `backend`: Express API.
- `frontend`: React application.
- `docs`: Planning and requirement documents.

## Quick Start

1. Install dependencies.

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment files.

```bash
cd backend && copy .env.example .env
cd ../frontend && copy .env.example .env
```

3. Run backend and frontend in separate terminals.

```bash
npm run dev:backend
npm run dev:frontend
```

Backend runs on `http://localhost:5000`.
Frontend runs on `http://localhost:5173`.

## Core API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/parcels`
- `GET /api/parcels`
- `GET /api/parcels/metrics`
- `GET /api/parcels/tracking/:trackingId`
- `PATCH /api/parcels/:id/assign`
- `PATCH /api/parcels/:id/status`

## Default Roles

- `super_admin`
- `branch_manager`
- `dispatcher`
- `rider`
- `customer`

## Requirement Template

See `docs/requirements-template.md` for the full requirement document format.
