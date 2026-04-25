# City Wallet Backend

Small TypeScript API for the City Wallet demo. It receives anonymized context
from the mobile app, selects a merchant from Postgres, creates a deterministic
GenUI offer payload, and manages redemption tokens.

## Setup

```bash
cp .env.example .env
npm install
```

Start Postgres from the repo root:

```bash
docker compose up -d db
```

Prepare and seed the database:

```bash
npm run db:migrate
npm run db:seed
```

Run the API:

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Environment

- `DATABASE_URL` - Postgres connection string.
- `PORT` - API port. DigitalOcean App Platform provides this at runtime.
- `CORS_ORIGIN` - Allowed origin, or `*` for local hackathon development.

## Endpoints

- `GET /health`
- `POST /offers/generate`
- `POST /offers/:offerId/accept`
- `GET /redemptions/:token`
- `POST /redemptions/:token/validate`

## DigitalOcean Notes

The server listens on `process.env.PORT` and exposes `/health` for App Platform
health checks. For deployment, point `DATABASE_URL` at DigitalOcean Managed
Postgres and use `npm run start:migrate` or the included Dockerfile command so
Prisma migrations run before the API starts.
