# Tender Management System - Backend

Node + Express + MongoDB backend for the Tender Management System.

Setup

1. Copy `.env.example` to `.env` and configure `PORT`, `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGIN` (comma-separated origins, default: `http://localhost:5173`).

Authentication & Security Notes:
- **JWT Expiry**: JWT tokens issued on login (`POST /api/auth/login`) expire after **8 hours** (covering a standard 8-hour workday).
- **Rate Limiting**: Authentication endpoints (`/api/auth/login` and `/api/auth/register`) are rate-limited to a maximum of **10 attempts per 15 minutes per IP**.
- **Headers & CORS**: HTTP security headers enabled via `helmet`. CORS is restricted to allowed `CORS_ORIGIN` domains.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run in development:

```bash
npm run dev
```

4. Seed sample data (optional):

```bash
npm run seed
```

> **Demo Credentials (for local/demo use only, do not use in production)**:
> - **Email**: `abc@gmail.com`
> - **Password**: `ABC@123`
> - **Role**: `Admin`

APIs

Base: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- CRUD endpoints for categories, departments, staff, bidders, records, users.
