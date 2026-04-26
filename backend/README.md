# City Wallet Backend

The backend is the always-on part of the demo. It serves:

- `GET /health`
- `GET /merchants`
- `POST /coupons/generate`
- `/admin` for the merchant admin UI

## Local Run Commands

```bash
cd /Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The local API listens on `http://localhost:4000` by default.

## Production Startup

The production entrypoint is:

```bash
npm run start:production
```

It does three things in order:

1. `prisma migrate deploy`
2. optional demo seed when `SEED_DEMO_DATA=true`
3. start `dist/src/index.js`

The Dockerfile uses that entrypoint and defaults `PORT=8080`.

## DigitalOcean Runtime Env Vars

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Runtime secret | Postgres connection string. |
| `PORT` | Runtime | Express listen port. |
| `CORS_ORIGIN` | Runtime | Browser CORS allowlist. |
| `GROQ_API_KEY` | Runtime secret | Required Groq API key. |
| `GROQ_MODEL` | Runtime | Groq model slug. |
| `GROQ_BASE_URL` | Runtime | Groq OpenAI-compatible base URL. |
| `SEED_DEMO_DATA` | Startup runtime | Seeds merchants on container start when `true`. |

## DigitalOcean Deploy

Start from:

- [.do/app.yaml.example](/Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/.do/app.yaml.example)

After deploy, verify:

```bash
curl https://<your-app>.ondigitalocean.app/health
curl "https://<your-app>.ondigitalocean.app/merchants?cityId=linz-demo"
```
