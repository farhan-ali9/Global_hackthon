# City Wallet Backend

Small TypeScript API for the City Wallet demo. It exposes a list of merchants
in a broad area and generates a per-merchant coupon by calling an LLM
(OpenRouter) under each merchant's markdown rules. No user data is persisted.

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

## Context Pipeline Simulation

Run a 10-minute virtual movement simulation (fast by default, no coupon generation):

```bash
npm run simulate:user-context
```

Useful flags:

- `--realtime` — actually waits the full 10 minutes.
- `--durationMinutes=10` — set simulation duration.
- `--stepSeconds=20` — set step cadence.
- `--apiBaseUrl=http://localhost:4000` — override API target.

## Environment

- `DATABASE_URL` — Postgres connection string.
- `PORT` — API port. DigitalOcean App Platform provides this at runtime.
- `CORS_ORIGIN` — Allowed origin, or `*` for local hackathon development.
- `OPENROUTER_API_KEY` — required. OpenRouter API key for coupon generation.
- `OPENROUTER_MODEL` — model slug. Defaults to `openrouter/free`.

## Endpoints

### `GET /health`

Returns `{ "ok": true }`.

### `GET /merchants?cityId=<id>`

Returns the list of merchants in a broad area. The `cityId` query parameter
is optional; when omitted, all merchants are returned. Merchant `rules` are
intentionally **not** included — they're merchant strategy data the server
keeps private.

```bash
curl http://localhost:4000/merchants?cityId=linz-demo
```

```json
[
  {
    "id": "merchant-cafe-traxlmayr",
    "description": "Cafe Traxlmayr — classic Linz coffee house near the Landstrasse...",
    "cityId": "linz-demo",
    "coordinates": { "latitude": 48.3069, "longitude": 14.2868 }
  }
]
```

### `POST /coupons/generate`

Body:

```json
{
  "merchantId": "merchant-cafe-traxlmayr",
  "userIntent": "want_coffee",
  "context": { "weather": "rain", "timeOfDay": "morning" }
}
```

`context` is a free-form JSON object the device sends. `userIntent` is the next
intent chosen by the local device model, and `merchantId` is the merchant chosen
by that same local model. The server forwards those values to OpenRouter along
with the merchant and authoritative markdown rules loaded from backend
configuration for that merchant. Response:

```json
{
  "merchantId": "merchant-cafe-traxlmayr",
  "merchant": {
    "id": "merchant-cafe-traxlmayr",
    "description": "Cafe Traxlmayr — classic Linz coffee house near the Landstrasse...",
    "cityId": "linz-demo",
    "coordinates": { "latitude": 48.3069, "longitude": 14.2868 }
  },
  "headline": "Rainy-day pick-me-up",
  "body": "Step in for a warm single-origin espresso — 15% off until 14:00.",
  "saving": {
    "type": "percentage",
    "value": 15,
    "displayText": "15% off"
  },
  "discountPercent": 15,
  "ctaLabel": "Redeem now",
  "explanationTags": ["rain", "morning", "quiet-hours"],
  "expiresAt": "2026-04-25T11:00:00.000Z",
  "userIntent": "want_coffee"
}
```

The coupon is not persisted — generation is stateless.

## DigitalOcean Notes

The server listens on `process.env.PORT` and exposes `/health` for App Platform
health checks. For deployment, point `DATABASE_URL` at DigitalOcean Managed
Postgres and use `npm run start:migrate` or the included Dockerfile command so
Prisma migrations run before the API starts. Set `OPENROUTER_API_KEY` as a
secret env var in App Platform.
