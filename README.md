# City Wallet Hackathon

City Wallet is the DSV-Gruppe Generative City Wallet hackathon project. The repo
has two packages:

- `backend/` - TypeScript/Postgres API for merchant lookup and coupon generation.
- `city_wallet/` - Expo mobile app with Expo Go, dev-client, and EAS preview build paths.

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

Use Expo Go or a local development build from the Metro output. If testing on a
physical phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP instead
of `localhost`.

## Project Structure

- `backend/prisma/` - Postgres schema, migration, and seed data.
- `backend/src/` - Express API, request schemas, admin routes, and Groq coupon
  generator.
- `city_wallet/app/` - Minimal generate, offer detail, and redemption screens.
- `city_wallet/src/context-engine/` - Placeholder local anonymized-context
  provider.
- `city_wallet/src/lib/` - API client and in-memory demo handoff state.
- `city_wallet/src/types/` - Mobile API contracts.

## Flow

1. The mobile context provider builds an anonymized user context.
2. The app fetches seeded merchants from the backend.
3. The app ranks merchants locally from device context.
4. The app sends `{ merchantId, userIntent, context }` to `POST /coupons/generate`.
5. The backend calls Groq with merchant rules and returns typed coupon JSON.

## DigitalOcean

The always-on setup is:

- DigitalOcean App Platform hosts the backend API and admin UI.
- DigitalOcean Managed Postgres stores merchants, rules, sessions, and analytics.
- An EAS `preview` internal distribution build is the installable mobile app.

To prepare the DigitalOcean app spec:

```bash
cp .do/app.yaml.example .do/app.yaml
```

Edit `.do/app.yaml`:

- Replace `CHANGE_ME_GITHUB_OWNER/CHANGE_ME_REPO`.
- Replace `CHANGE_ME_MANAGED_POSTGRES_CLUSTER` with the DigitalOcean Managed
  Postgres cluster name.
- Replace `CHANGE_ME_GROQ_API_KEY` or set `GROQ_API_KEY` as an encrypted secret
  in the App Platform UI.

Deploy with the DigitalOcean UI or `doctl`:

```bash
doctl apps create --spec .do/app.yaml
```

The backend container listens on `PORT=8080`, exposes `GET /health`, runs
`prisma migrate deploy`, and seeds demo merchants when `SEED_DEMO_DATA=true`.
After deployment, verify:

```bash
curl https://<your-app>.ondigitalocean.app/health
curl "https://<your-app>.ondigitalocean.app/merchants?cityId=linz-demo"
```

## Mobile Preview Build

The local `development` EAS profile is for Metro-based debugging. For a real
installable app that works anywhere without your laptop, use the `preview`
profile.

Configure the preview API URL in EAS before building:

```bash
cd city_wallet
eas env:create --environment preview --name EXPO_PUBLIC_API_BASE_URL --value https://<your-app>.ondigitalocean.app --visibility plaintext
eas env:create --environment preview --name GOOGLE_MAPS_API_KEY --value <your-google-maps-key> --visibility sensitive
```

Then build and install:

```bash
eas build --profile preview --platform all
```

The preview profile is internal distribution, not a development client, so it
bundles JavaScript and does not need Metro. It uses the `preview` EAS Update
channel. JS-only fixes can be published to installed preview builds with:

```bash
eas update --channel preview --message "Describe the update"
```
