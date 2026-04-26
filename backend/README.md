# City Wallet Backend

Small TypeScript API for the City Wallet demo. It exposes a list of merchants
in a broad area and generates a per-merchant coupon by calling an LLM
(Groq) under each merchant's markdown rules. No user data is persisted.

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
- `GROQ_API_KEY` — required. Groq API key for coupon generation.
- `GROQ_MODEL` — model slug. Defaults to `llama-3.1-8b-instant`.
- `GROQ_BASE_URL` — optional OpenAI-compatible Groq base URL. Defaults to
  `https://api.groq.com/openai/v1`.
- `SEED_DEMO_DATA` — set to `true` in production to seed demo merchants during
  container startup after migrations run.

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
by that same local model. The server forwards those values to Groq along
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

The Dockerfile is set up for DigitalOcean App Platform:

- `PORT=8080` by default.
- `GET /health` is the App Platform health check.
- `npm run start:production` runs `prisma migrate deploy`, optionally seeds demo
  data when `SEED_DEMO_DATA=true`, then starts `dist/src/index.js`.
- The admin UI is served by the same backend under `/admin`.

Use the root `.do/app.yaml.example` as the App Platform starting point. Set
`DATABASE_URL` from the App Platform Postgres binding and keep `GROQ_API_KEY` as
a secret.

Useful production checks:

```bash
curl https://<your-app>.ondigitalocean.app/health
curl "https://<your-app>.ondigitalocean.app/merchants?cityId=linz-demo"
```
