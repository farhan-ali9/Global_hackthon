# City Wallet

<p align="center">
  <img src="docs/home-screen.png" alt="City Wallet mobile app screen" width="48%">
  <img src="docs/coupon.png" alt="City Wallet merchant admin screen" width="48%">
</p>

City Wallet is a hackathon MVP for privacy-preserving local commerce. The app
uses on-device context to choose a relevant nearby merchant, then asks a backend
to generate a constrained coupon for that merchant without sending precise user
location, raw movement behavior, or a full preference profile to the server.

The project was built as a working end-to-end prototype: a React Native mobile
app, an Express API, a Prisma/Postgres data layer, merchant administration
screens, and a deployment-ready backend. The original DigitalOcean demo server
was used for the hackathon, but this README assumes you will run the project
locally.

## Current Demo Status

The hackathon backend was deployed at:

- https://city-wallet-8hicn.ondigitalocean.app

That server is temporary and may be shut down. Use the local setup below as the
source of truth for running and reviewing the project.

If the server is still online, these checks should respond:

```bash
curl "https://city-wallet-8hicn.ondigitalocean.app/health"
curl "https://city-wallet-8hicn.ondigitalocean.app/merchants?cityId=linz-demo"
```

## What It Does

- Builds private user context on the device from signals such as location,
  time, profile state, and interaction history.
- Fetches broad merchant candidates from the backend by city instead of sending
  exact user coordinates.
- Ranks merchant candidates locally so sensitive context stays on the phone.
- Requests a single coupon from the backend after the app has selected a
  merchant.
- Uses merchant rules and discount constraints to generate typed coupon payloads
  for the app UI.
- Provides merchant admin screens for signup, merchant profile management,
  coupon rules, and basic analytics.

## Architecture

```mermaid
flowchart LR
  User["Mobile user"] --> App["Expo React Native app"]
  App --> Context["On-device context engine"]
  Context --> Ranking["Local merchant ranking"]
  App -->|cityId only| API["Express API"]
  API --> DB["Postgres via Prisma"]
  API --> Admin["Merchant admin UI"]
  Ranking -->|selected merchant + abstract intent| API
  API --> LLM["Groq-compatible coupon generation"]
  LLM --> API
  API -->|typed coupon JSON| App
```

The important boundary is that the backend owns merchant data, coupon rules,
generation, analytics, and deployment, while the mobile app owns private context
capture and final merchant selection.

## Tech Stack

- **Mobile:** Expo, React Native, Expo Router, SQLite, React Native Maps
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** Postgres
- **AI flow:** local/on-device recommendation path plus Groq-compatible coupon
  generation on the backend
- **Deployment:** DigitalOcean App Platform, Docker, managed Postgres
- **Developer tooling:** npm workspaces by folder, TypeScript, Expo lint

## Repository Layout

```text
.
├── backend/      # Express API, Prisma schema/migrations, admin UI, deployment entrypoint
├── city_wallet/  # Expo React Native app
├── .do/          # DigitalOcean App Platform example spec
├── DESIGN.md
├── PROJECT_GOALS_AND_ARCHITECTURE.md
└── docker-compose.yml
```

## Run Locally

You need Node.js, npm, Docker, and either Expo Go or a native iOS/Android
development environment.

### 1. Start Postgres And The Backend

```bash
docker compose up -d db
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` if needed. For a local demo, the important values are:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/city_wallet?schema=public
PORT=4000
CORS_ORIGIN=*
SEED_DEMO_DATA=true
```

Then create the database schema, seed demo merchants, and start the API:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

The local API listens on `http://localhost:4000` by default.

Verify it:

```bash
curl "http://localhost:4000/health"
curl "http://localhost:4000/merchants?cityId=linz-demo"
```

The merchant admin UI is available at:

```text
http://localhost:4000/admin
```

### 2. Start The Mobile App

```bash
cd ../city_wallet
npm install
cp .env.example .env
```

Set the app to call your local backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_DEFAULT_CITY_ID=linz-demo
```

Start Expo:

```bash
npm start
```

For an iOS simulator, `localhost` usually works. For a physical phone, replace
`localhost` with your computer's LAN IP address, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:4000
```

After changing `EXPO_PUBLIC_*` values, restart Expo or rebuild the native app so
the new values are picked up.

### 3. Optional Native iPhone Build

For iPhone demo builds, sync native dependencies and open the Xcode workspace:

```bash
npx pod-install
open ios/citywallet.xcworkspace
```

Use a Release scheme build for standalone demos. Debug builds expect Metro to be
available on the development machine.

### 4. Useful Checks

Backend:

```bash
cd backend
npm run typecheck
npm run test
```

Mobile:

```bash
cd city_wallet
npm run lint
```

## Deployment Notes

The backend is designed for DigitalOcean App Platform. The current deployment
was configured to track the `digital-ocean` branch during the hackathon.

1. Copy the example App Platform spec:

```bash
cp .do/app.yaml.example .do/app.yaml
```

2. Fill in the GitHub repository, managed Postgres cluster, and backend secrets.
3. Deploy through DigitalOcean or `doctl`.

The production startup command runs Prisma migrations, optionally seeds demo
data, and then starts the compiled Express server.

Required backend runtime variables are documented in `backend/.env.example`.
The most important ones are `DATABASE_URL`, `GROQ_API_KEY`, `PORT`,
`CORS_ORIGIN`, and `SEED_DEMO_DATA`.

## MVP Status

This is a hackathon MVP, not a production financial wallet. The current version
focuses on proving the privacy-preserving coupon flow, local merchant selection,
backend coupon generation, and the merchant administration loop. The app and
backend are kept intentionally small so the core demo remains easy to run,
inspect, and explain after the hosted demo server is shut down.

## Additional Docs

- `PROJECT_GOALS_AND_ARCHITECTURE.md` explains the privacy boundary and device-led
  merchant selection model.
- `backend/README.md` contains backend-specific setup and deployment details.
- `city_wallet/README.md` contains mobile app build notes.
