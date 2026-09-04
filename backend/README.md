# Tender Management System - Backend

Node + Express + Supabase (PostgreSQL) backend for the CEB Tender Management System.

## Setup

1. Copy `.env.example` to `.env` and configure `PORT`, `JWT_SECRET`, `CORS_ORIGIN`, and Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. Run the relational database migration script:
   - Open the Supabase dashboard for your project.
   - Go to the **SQL Editor**.
   - Copy and execute the SQL statements from `backend/migrations/001_initial_schema.sql` to initialize all PostgreSQL tables, triggers, and foreign keys.

3. Install dependencies:

```bash
cd backend
npm install
```

4. Run in development:

```bash
npm run dev
```

5. Seed demo user accounts (optional):

```bash
npm run seed
```

> **Demo Credentials (for local/demo use only)**:
> - **Admin**: `abc@gmail.com` / `ABC@123`
> - **Procurement**: `procurement@ceb-tms.local` / `Procurement@123`
> - **CECOM**: `cecom@ceb-tms.local` / `Cecom@123`
> - **Clerk**: `clerk@ceb-tms.local` / `Clerk@123`

## Authentication & Security Notes:
- **JWT Expiry**: JWT tokens issued on login (`POST /api/auth/login`) expire after **8 hours** (covering a standard 8-hour workday).
- **Rate Limiting**: Authentication endpoints (`/api/auth/login` and `/api/auth/register`) are rate-limited to a maximum of **10 attempts per 15 minutes per IP**.
- **Headers & CORS**: HTTP security headers enabled via `helmet`. CORS is restricted to allowed `CORS_ORIGIN` domains.

## APIs

Base: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- CRUD endpoints for categories, departments, staff, bidders, committees, records, users, and audit logs.
