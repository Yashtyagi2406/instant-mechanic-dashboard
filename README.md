# Instant Mechanic — Live Vehicle Service Operations Dashboard

A production-quality full-stack dashboard for monitoring bookings, mechanics,
customers, and revenue for a vehicle-repair business — built as a 48-hour
take-home assignment for Instant Mechanic.

> **Live demo:** *fill in after deployment*  
> **API docs:** `https://api.YOUR_DOMAIN.com/api/docs`  
> **Default login:** `admin@instantmechanic.dev` / `Admin@123`

---

## 1. Project Overview

The dashboard gives an operations team a real-time view of the entire service
pipeline. Key features:

- **Live updates** via Socket.io — booking status changes appear instantly on
  every connected dashboard without a page reload.
- **500+ realistic seed bookings** across 90 days so the charts and tables are
  meaningful from first launch.
- **Full REST API** with Swagger docs, JWT auth, rate limiting, Zod input
  validation, and a clean service-layer architecture.
- **Analytics charts** (bookings over time, revenue over time, status
  breakdown, category breakdown) powered by Recharts.
- **CSV export** on the bookings table, dark mode, skeleton loading states,
  and responsive mobile layout.

---

## 2. Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | Next.js 15 (App Router) · TypeScript · Tailwind CSS · Recharts |
| Backend     | Node.js · Express · TypeScript |
| Database    | PostgreSQL 16 · Prisma ORM v5 |
| Real-time   | Socket.io (WebSocket) |
| Auth        | JWT (Bearer token · 7-day expiry) |
| Infra       | Docker · docker-compose · Vercel (frontend) · AWS EC2 (backend) |
| Dev tools   | ts-node-dev · @faker-js/faker · Swagger UI |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Next.js on Vercel)                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React pages ← AuthContext ← JWT localStorage    │  │
│  │            ← SocketContext ← Socket.io client    │  │
│  └─────────────────┬──────────────────┬─────────────┘  │
│                    │ REST (fetch)      │ WebSocket       │
└────────────────────┼──────────────────┼────────────────-┘
                     ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│  Express API (AWS EC2 / Docker)                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │  Routes   │→│ Controllers│→│   Services (BL)    │  │
│  └───────────┘  └───────────┘  └────────┬──────────┘  │
│                                          │              │
│  Socket.io server (same HTTP server)     │              │
│  Live simulator (setInterval, 8s)        │              │
└──────────────────────────────────────────┼─────────────-┘
                                           ▼
                         ┌─────────────────────────────┐
                         │  PostgreSQL (Docker volume)  │
                         │  Prisma ORM + migrations     │
                         └─────────────────────────────┘
```

**Real-time flow:**
1. Simulator or manual PATCH `/api/bookings/:id/status`
2. Service updates DB + logs `booking_status_history` row
3. Route emits `booking:updated` (full booking payload) via Socket.io
4. Route also fetches fresh dashboard stats and emits `dashboard:stats-updated`
5. Frontend `SocketContext` receives both events → patches React state in-place
6. KPI cards animate briefly to signal the update

---

## 4. Local Setup

### Prerequisites
- Node 20+, npm 10+
- Docker Desktop running

### Step 1 — Clone & configure

```bash
git clone https://github.com/Yashtyagi2406/instant-mechanic-dashboard.git
cd instant-mechanic-dashboard
```

**Backend:**
```bash
cp backend/.env.example backend/.env
# The defaults work with docker-compose out of the box
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
# Defaults point to localhost:4000 — no changes needed for local dev
```

### Step 2 — Start the database

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432`.

### Step 3 — Run migrations + seed

```bash
cd backend
npm install
npx prisma@5 migrate deploy   # applies prisma/migrations/
npm run seed                  # inserts 520 bookings, 50 customers, 20 mechanics
```

### Quick Start (from project root)

```bash
# 1. Start the PostgreSQL database
docker compose up -d postgres

# 2. Run migrations and seed data
npm run db:migrate
npm run seed

# 3. Start both backend and frontend concurrently
npm run dev
```

### Alternatively (running services in separate terminal tabs)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → API running on http://localhost:4000
# → Swagger UI: http://localhost:4000/api/docs
# → Socket.io live simulator running
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → Next.js running on http://localhost:3000
```

Open `http://localhost:3000` → login with `admin@instantmechanic.dev` / `Admin@123`.

### docker-compose alternative (full stack)

```bash
docker compose up --build
# Starts postgres + backend (after migration).
# Frontend still runs separately with npm run dev.
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ✅ | HTTP server port (default: 4000) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `CORS_ORIGIN` | ✅ | Frontend URL for CORS allow-list |
| `JWT_SECRET` | ✅ | Secret for signing JWTs (≥ 32 chars in prod) |
| `DISABLE_SIMULATOR` | — | Set `"true"` to disable the live simulator |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend REST API URL (include `/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Backend WebSocket URL (no `/api`) |

---

## 6. API Documentation

Swagger UI is exposed at `GET /api/docs` on the backend.

Key endpoint groups:

| Group | Base path | Notes |
|-------|-----------|-------|
| Auth | `/api/auth` | Login, register, me — unprotected |
| Dashboard | `/api/dashboard` | Aggregated KPI stats |
| Bookings | `/api/bookings` | CRUD + status update; triggers Socket.io |
| Mechanics | `/api/mechanics` | List + detail |
| Customers | `/api/customers` | Paginated list + detail |
| Analytics | `/api/analytics` | 4 chart-ready data endpoints |

All protected routes require `Authorization: Bearer <token>`.

---

## 7. Deployment

### Frontend → Vercel

1. Import the GitHub repo in [vercel.com](https://vercel.com) and set the **root directory** to `frontend`.
2. Add environment variables in Vercel's project settings:
   - `NEXT_PUBLIC_API_URL` → `https://api.YOUR_DOMAIN.com/api`
   - `NEXT_PUBLIC_SOCKET_URL` → `https://api.YOUR_DOMAIN.com`
3. Deploy. Vercel auto-detects Next.js.

### Backend → AWS EC2

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step EC2 runbook
covering Docker, nginx reverse proxy, and Certbot TLS.

**Live URLs** *(fill in after deployment)*:
- Frontend: https://instant-mechanic-dashboard.vercel.app
- API: https://api.YOUR_DOMAIN.com
- Swagger: https://api.YOUR_DOMAIN.com/api/docs

---

## 8. AI Usage

<!-- TODO: fill in after you review what was generated -->

**Structure for your review:**

- **AI tools used:** <!-- e.g. Antigravity (Gemini/Claude) -->
- **What the AI generated:** <!-- list the major pieces -->
- **What I (Yash) personally reviewed / modified / wrote myself:**
  <!-- Be specific — e.g. "I rewrote the seed script logic", "I added the
       mechanic status filter after noticing it was missing", etc. -->
- **What I learned / could explain in an interview:**
  <!-- e.g. "I understand the Socket.io singleton pattern, why we use
       $transaction for the status update + history log, why the simulator
       uses setInterval not a separate process, etc." -->

---

## Architecture Decisions (for interview prep)

| Decision | Rationale |
|----------|-----------|
| **REST over GraphQL** | Simpler to explain, well-matched to well-defined data shapes, and the spec calls for REST |
| **Prisma over raw SQL** | Auto-generated TypeScript types, readable migrations, `$transaction` for atomic writes |
| **Socket.io singleton** | Allows any route handler to call `getSocketIO()` without prop-drilling the server instance |
| **Simulator as `setInterval`** | Simplest demo-friendly approach; easily disabled in prod with `DISABLE_SIMULATOR=true` |
| **JWT in localStorage** | Simpler than httpOnly cookies for a SPA; acceptable for an internal ops tool where XSS risk is low |
| **Status history table** | Every transition is logged with old→new status, enabling the timeline view and audit trail |
| **Monorepo flat layout** | `/frontend` and `/backend` are separate deployable apps with no shared build tooling — easiest to reason about and deploy independently |
| **`booking_status_history` cascade delete** | If a booking is deleted, history goes too; referential integrity without orphan rows |
