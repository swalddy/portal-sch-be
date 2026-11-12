# Personal API

Centralized, reusable REST API backend built with **Bun**, **ElysiaJS**, **TypeScript**, and **Prisma ORM 7** on **Neon PostgreSQL**. Designed to serve multiple independent frontend applications (Next.js, Postman, and server-to-server clients) with strict type safety, modular architecture, and OpenAPI documentation.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh/) (v1.4.4+)
- **Framework:** [ElysiaJS](https://elysiajs.com/) (`1.4.31`)
- **Language:** TypeScript (Strict mode)
- **Database & ORM:** Neon PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg` + `pg`)
- **Authentication:** Neon Auth JWT (`jose` JWKS) + Timing-safe API Key (`x-api-key`)
- **Documentation:** OpenAPI / Swagger (`@elysiajs/swagger`)
- **CORS:** `@elysiajs/cors`
- **Target Deployment:** Vercel (`bunVersion: "1.x"` + `@vercel/functions`)

## Project Structure

```text
portal_sch_api/
├── api/
│   └── index.ts              # Vercel Functions entry point (exports app.fetch)
├── prisma/
│   ├── migrations/           # SQL migration history
│   └── schema.prisma         # PostgreSQL schema & Note model
├── src/
│   ├── lib/
│   │   ├── auth.ts           # JWT (JWKS) & timing-safe API key verification
│   │   ├── env.ts            # Environment variable getters
│   │   └── prisma.ts         # Reusable Prisma 7 client singleton (@prisma/adapter-pg)
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # requireAuth & requireRole guards
│   │   ├── error.middleware.ts      # Centralized error mapper (AppError, Prisma, Elysia)
│   │   ├── rate-limit.middleware.ts # Pluggable rate limiter (429 + X-RateLimit-* headers)
│   │   └── security.middleware.ts   # HTTP security headers
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.route.ts        # GET /api/v1/auth/providers, /auth/me
│   │   ├── health/
│   │   │   ├── health.controller.ts # Database connectivity probe (SELECT 1)
│   │   │   └── health.route.ts      # GET /api/v1/health
│   │   └── notes/
│   │       ├── notes.controller.ts  # Request/response orchestration
│   │       ├── notes.route.ts       # Protected /api/v1/notes endpoints
│   │       ├── notes.schema.ts      # Elysia TypeBox validation schemas
│   │       └── notes.service.ts     # Prisma queries & business logic
│   ├── plugins/
│   │   ├── cors.plugin.ts           # CORS configuration
│   │   └── swagger.plugin.ts        # OpenAPI 3.0 & securitySchemes
│   ├── utils/
│   │   ├── errors.util.ts           # Custom AppError classes
│   │   └── response.util.ts         # Standardized JSON response helpers
│   ├── app.ts                       # Application factory & route assembly
│   └── index.ts                     # Local HTTP development entry point
├── tests/                           # Automated integration & security tests
│   ├── health.test.ts
│   ├── notes.test.ts
│   └── security.test.ts
├── .env.example                     # Sample environment configuration
├── .gitignore
├── neon.ts                          # Neon CLI infrastructure config
├── package.json
├── prisma.config.ts                 # Prisma 7 CLI config (direct/unpooled URL)
├── tsconfig.json
├── vercel.json                      # Vercel Bun runtime & rewrite config
└── README.md
```

---

## Getting Started

### Installation & Setup

```bash
bun install
cp .env.example .env
```

Configure `.env` (or pull Neon variables via `neon env pull -s postgres -s auth`), then run:

```bash
bun run db:generate
bun run db:migrate
bun run dev
```

### Available Scripts

- `bun run dev` — Start local development server with watch mode
- `bun run start` — Start local server without file watcher
- `bun run build` — Generate Prisma Client and run TypeScript check (used by Vercel)
- `bun run typecheck` — Run strict TypeScript compilation check (`tsc --noEmit`)
- `bun run test` — Run all automated tests (`bun test`)
- `bun run db:generate` — Generate Prisma 7 Client
- `bun run db:migrate` — Create/apply development migrations (`prisma migrate dev`)
- `bun run db:deploy` — Apply pending migrations in production (`prisma migrate deploy`)
- `bun run db:push` — Push schema directly (`prisma db push`)
- `bun run db:studio` — Open Prisma Studio

---

## API Documentation

- **Base URL (Local):** `http://localhost:3000`
- **API Prefix:** `/api/v1`
- **Swagger UI:** `GET /docs` (`http://localhost:3000/docs`)
- **OpenAPI JSON (Postman Import):** `GET /docs/json` (`http://localhost:3000/docs/json`)

### Authentication

Protected endpoints require **one** of the following headers:

| Method | Header | Use Case |
| --- | --- | --- |
| **Bearer JWT** | `Authorization: Bearer <jwt>` | Frontend apps (Next.js) authenticated via Neon Auth |
| **API Key** | `x-api-key: <api-key>` | Personal scripts, Postman testing, server-to-server calls |

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "Optional status message",
  "data": {},
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional validation or debug details",
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

### Common HTTP Status Codes & Headers

- **Status Codes:** `200` OK, `201` Created, `400` Bad Request / Parse Error, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `422` Validation Failed, `429` Too Many Requests, `500` Internal Server Error, `503` Service Degraded.
- **Rate Limit Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` (on `429`).

---

### Endpoints Overview

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | API metadata & doc links |
| `GET` | `/docs` | Public | Interactive Swagger UI |
| `GET` | `/docs/json` | Public | OpenAPI 3.0 specification JSON |
| `GET` | `/api/v1/health` | Public | API & Neon PostgreSQL health check |
| `GET` | `/api/v1/auth/providers` | Public | Enabled authentication methods |
| `GET` | `/api/v1/auth/me` | Protected | Current authenticated principal |
| `GET` | `/api/v1/notes` | Protected | List notes (paginated & filterable) |
| `GET` | `/api/v1/notes/:id` | Protected | Get single note by UUID |
| `POST` | `/api/v1/notes` | Protected | Create a new note |
| `PATCH` | `/api/v1/notes/:id` | Protected | Partially update a note |
| `DELETE` | `/api/v1/notes/:id` | Protected | Delete a note by UUID |

---

### 1. System & Health

#### `GET /`
Returns basic API metadata.

```json
{
  "name": "Personal API Backend",
  "version": "1.0.0",
  "docs": "/docs",
  "openApiSpec": "/docs/json",
  "apiPrefix": "/api/v1"
}
```

#### `GET /api/v1/health`
Checks server uptime and executes `SELECT 1` against Neon PostgreSQL.

- **200 OK (Healthy):**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "database": {
      "status": "connected",
      "latencyMs": 14
    },
    "environment": "development",
    "uptime": "42s",
    "timestamp": "2026-11-12T08:00:00.000Z"
  },
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```
- **503 Service Unavailable (Degraded):** returned if the database connection fails.

---

### 2. Auth

#### `GET /api/v1/auth/providers` (Public)
Reports enabled auth mechanisms without exposing secrets.

```json
{
  "success": true,
  "message": "Authentication providers retrieved successfully",
  "data": {
    "bearerJwt": true,
    "apiKey": true,
    "issuer": "https://ep-sample.neonauth.region.aws.neon.tech/neondb/auth"
  },
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

#### `GET /api/v1/auth/me` (Protected)
Verifies credentials (`Authorization: Bearer <jwt>` or `x-api-key`) and returns the authenticated principal.

```json
{
  "success": true,
  "message": "Authenticated principal retrieved successfully",
  "data": {
    "sub": "api-key-client",
    "role": "admin",
    "authType": "api-key"
  },
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

---

### 3. Notes (Protected)

All `/api/v1/notes` routes require `Authorization: Bearer <jwt>` or `x-api-key: <api-key>`.

#### `GET /api/v1/notes`
Lists notes ordered by `isPinned` (desc) then `updatedAt` (desc).

- **Query Parameters:**
  - `page` *(number, optional, default `1`, min `1`)*
  - `limit` *(number, optional, default `20`, min `1`, max `100`)*
  - `search` *(string, optional, max `100`)* — case-insensitive match on `title` or `content`
  - `pinned` *(boolean, optional)* — filter by `isPinned` (`true` / `false`)

- **Example:** `GET /api/v1/notes?page=1&limit=10&pinned=true`
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Project Ideas",
        "content": "Build personal REST API with ElysiaJS",
        "isPinned": true,
        "createdAt": "2026-11-12T08:00:00.000Z",
        "updatedAt": "2026-11-12T08:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

#### `GET /api/v1/notes/:id`
Retrieves a single note by UUID.

- **Path Param:** `id` *(UUID)*
- **Responses:** `200 OK`, `404 Not Found`, `422 Validation Failed` (invalid UUID)

#### `POST /api/v1/notes`
Creates a new note.

- **Request Body:**
```json
{
  "title": "Project Ideas",
  "content": "Build personal REST API with ElysiaJS",
  "isPinned": true
}
```
  - `title` *(string, required, 1–200 chars, non-blank)*
  - `content` *(string, required, 1–10000 chars, non-blank)*
  - `isPinned` *(boolean, optional, default `false`)*
- **Response:** `201 Created` with the created note object.

#### `PATCH /api/v1/notes/:id`
Partially updates an existing note. At least one field must be provided.

- **Path Param:** `id` *(UUID)*
- **Request Body:**
```json
{
  "title": "Updated Title",
  "isPinned": false
}
```
- **Responses:** `200 OK`, `400 Bad Request` (empty body or blank text), `404 Not Found`, `422 Validation Failed`

#### `DELETE /api/v1/notes/:id`
Deletes a note by UUID.

- **Path Param:** `id` *(UUID)*
- **Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Note deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2026-11-12T08:00:00.000Z"
}
```

---

## GitHub & Vercel Deployment

### 1. Push to GitHub

Verify no secrets (`.env`, `.neon`, `src/generated/`) are staged:

```bash
git status
git add .
git commit -m "feat: personal REST API with ElysiaJS, Prisma 7, Neon, and Vercel"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin master
```

### 2. Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and **Import** your GitHub repository.
2. Vercel automatically detects [`vercel.json`](vercel.json) (`bunVersion: "1.x"`), [`api/index.ts`](api/index.ts), and `bun run build`.
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `NODE_ENV` = `production`
   - `API_PREFIX` = `/api/v1`
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app` *(or comma-separated origins)*
   - `DATABASE_URL` = *(Neon pooled connection string `-pooler`)*
   - `DATABASE_URL_UNPOOLED` = *(Neon direct connection string, for CI migrations)*
   - `NEON_AUTH_BASE_URL` = *(from Neon Auth)*
   - `NEON_AUTH_JWKS_URL` = *(from Neon Auth)*
   - `API_KEY` = *(strong random secret for Postman / server-to-server clients)*
   - `RATE_LIMIT_MAX` = `100`
   - `RATE_LIMIT_WINDOW_MS` = `60000`
4. Click **Deploy**, then verify:
   - `GET https://<your-app>.vercel.app/api/v1/health`
   - `GET https://<your-app>.vercel.app/docs`
