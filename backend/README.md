# City Wallet Backend

Small TypeScript API for the City Wallet demo. It returns safe merchant
candidate metadata, receives a locally selected merchant id plus coarse intent,
creates a deterministic GenUI offer payload, and manages redemption tokens.

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
- `GET /merchants/candidates?cityId=stuttgart-demo`
- `POST /offers/generate`
- `POST /offers/:offerId/accept`
- `GET /redemptions/:token`
- `POST /redemptions/:token/validate`

`POST /offers/generate` expects:

```json
{
  "merchantId": "merchant-cafe-mueller",
  "intent": {
    "cityId": "stuttgart-demo",
    "timeOfDay": "lunch",
    "weatherBucket": "cold",
    "intentLabels": ["browsing"],
    "eventTags": [],
    "demandTags": []
  }
}
```

## DigitalOcean Notes

The server listens on `process.env.PORT` and exposes `/health` for App Platform
health checks. For deployment, point `DATABASE_URL` at DigitalOcean Managed
Postgres and use `npm run start:migrate` or the included Dockerfile command so
Prisma migrations run before the API starts.
