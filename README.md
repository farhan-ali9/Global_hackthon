# City Wallet Hackathon

City Wallet is the DSV-Gruppe Generative City Wallet hackathon project. The repo
has two packages:

- `backend/` - TypeScript/Postgres API for offer generation and redemption.
- `city_wallet/` - Expo custom dev-build mobile app for the on-device AI
  pipeline and tiny end-to-end demo flow.

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
npm run ios
```

Use a custom Expo dev build because the on-device Llama provider uses native
modules. For Android, run `npm run android`. After the dev client exists,
you can use `npm start`. If testing on a physical phone, set
`EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP instead of `localhost`.

## Project Structure

- `backend/prisma/` - Postgres schema, migration, and seed data.
- `backend/src/` - Express API, request schemas, and deterministic offer
  generator.
- `city_wallet/app/` - Minimal generate, offer detail, and redemption screens.
- `city_wallet/src/context-engine/` - Local private-signal provider boundary.
- `city_wallet/src/ai/` - On-device Llama model lifecycle, intent extraction,
  and local merchant ranking pipeline.
- `city_wallet/src/lib/` - API client and in-memory demo handoff state.
- `city_wallet/src/types/` - Mobile API contracts.

## Flow

1. The device captures private local signals.
2. The on-device Llama pipeline derives coarse intent and ranks merchant
   candidates locally.
3. The app asks the backend for candidates with `GET /merchants/candidates`.
4. The app sends only the selected merchant id and coarse intent to
   `POST /offers/generate`.
5. The backend creates a typed GenUI JSON offer within merchant rules.
6. Accepting the offer creates a redemption token.

## DigitalOcean

The backend is prepared for DigitalOcean App Platform. It listens on
`process.env.PORT`, exposes `GET /health`, uses `DATABASE_URL` for Postgres, and
includes a Dockerfile that runs Prisma migrations before starting the API.
