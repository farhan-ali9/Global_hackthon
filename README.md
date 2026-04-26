# City Wallet Hackathon

City Wallet is the DSV-Gruppe Generative City Wallet hackathon project. The repo
has two packages:

- `backend/` - TypeScript/Postgres API for offer generation and redemption.
- `city_wallet/` - Expo Go mobile app for the tiny end-to-end demo flow.

## Local Startup

Start Postgres and the backend:

```bash
docker compose up -d db
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

In another terminal, start the Expo app:

```bash
cd city_wallet
npm install
npm start
```

Use Expo Go to open the app from the Metro output. If testing on a physical
phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP instead of
`localhost`.

## Project Structure

- `backend/prisma/` - Postgres schema, migration, and seed data.
- `backend/src/` - Express API, request schemas, and deterministic offer
  generator.
- `city_wallet/app/` - Minimal generate, offer detail, and redemption screens.
- `city_wallet/src/context-engine/` - Placeholder local anonymized-context
  provider.
- `city_wallet/src/lib/` - API client and in-memory demo handoff state.
- `city_wallet/src/types/` - Mobile API contracts.

## Flow

1. The mobile context provider returns an anonymized context payload.
2. The app sends it to `POST /offers/generate`.
3. The backend returns seeded merchants from Postgres.
4. The app ranks merchants locally from device context.
5. Offer generation/redemption is currently paused while pipeline foundations are stabilized.

## DigitalOcean

The backend is prepared for DigitalOcean App Platform. It listens on
`process.env.PORT`, exposes `GET /health`, uses `DATABASE_URL` for Postgres, and
includes a Dockerfile that runs Prisma migrations before starting the API.
