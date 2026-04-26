# City Wallet Hackathon

City Wallet has two deployable parts:

- `backend/` - Express API, admin UI, Prisma migrations, and Groq coupon generation.
- `city_wallet/` - Expo React Native app built locally with Xcode for iPhone demos.

## Recommended Demo Setup

- Deploy `backend/` and Postgres to DigitalOcean App Platform.
- Build the iPhone app locally from Xcode in `Release`.
- Point the app at the DigitalOcean backend with `EXPO_PUBLIC_API_BASE_URL`.
- Do not rely on Metro for the demo unless you are explicitly testing a debug build.

## Local Run Commands

Backend:

```bash
docker compose up -d db
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

App debug workflow with Metro:

```bash
cd city_wallet
npm install
npx pod-install
npm start
```

If you want to run the iOS app from Xcode against Metro, open:

- [citywallet.xcworkspace](/Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/city_wallet/ios/citywallet.xcworkspace/contents.xcworkspacedata)

## Xcode Build Commands

Prepare the app config before building:

```bash
cd city_wallet
cp .env.example .env
```

Set at least:

```env
EXPO_PUBLIC_API_BASE_URL=https://<your-app>.ondigitalocean.app
EXPO_PUBLIC_ON_DEVICE_MODEL_ID=Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf
EXPO_PUBLIC_ENABLE_LOCAL_MODEL=false
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Then sync iOS dependencies:

```bash
cd city_wallet
npm install
npx pod-install
open ios/citywallet.xcworkspace
```

In Xcode:

1. Select the `citywallet` target.
2. Set `Signing & Capabilities` to your personal Apple ID team.
3. If needed, change the bundle identifier to a unique value.
4. Set the scheme to `Release` for a standalone demo build.
5. Select your iPhone and press Run.

Important:

- `Release` is the standalone demo build. It does not need Metro.
- `Debug` is the development build. It expects Metro to be available.
- `EXPO_PUBLIC_*` values are compiled into the app bundle. If you change them, rebuild the app from Xcode.

## DigitalOcean Deployment

Use App Platform plus Managed Postgres.

Create the app spec:

```bash
cp .do/app.yaml.example .do/app.yaml
```

Edit `.do/app.yaml`:

- Replace `CHANGE_ME_GITHUB_OWNER/CHANGE_ME_REPO`.
- Replace `CHANGE_ME_MANAGED_POSTGRES_CLUSTER`.
- Replace `CHANGE_ME_GROQ_API_KEY`, or enter `GROQ_API_KEY` in the App Platform UI as a secret.

Deploy:

```bash
doctl apps create --spec .do/app.yaml
```

The backend container:

- listens on `PORT=8080`
- runs `prisma migrate deploy`
- seeds demo merchants when `SEED_DEMO_DATA=true`
- starts the API and admin UI from the same service

Verify after deploy:

```bash
curl https://<your-app>.ondigitalocean.app/health
curl "https://<your-app>.ondigitalocean.app/merchants?cityId=linz-demo"
```

## Network Model

Use this when choosing how to demo:

- `Xcode Release` on iPhone:
  The app talks directly to `EXPO_PUBLIC_API_BASE_URL`. Your laptop is not needed after install.
- `Xcode Debug` on iPhone:
  The app needs Metro running on your laptop. Use the same network or tunnel as usual.
- Backend on DigitalOcean:
  The phone reaches the backend over the public internet. No shared Wi-Fi is required.

## Env Vars And Scope

### App build-time scope

These live in `city_wallet/.env` and are compiled into the native app bundle when you build from Xcode:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | App build-time | Public base URL the iPhone app calls for backend requests. |
| `EXPO_PUBLIC_ON_DEVICE_MODEL_ID` | App build-time | GGUF model identifier used by the on-device model client. |
| `EXPO_PUBLIC_ENABLE_LOCAL_MODEL` | App build-time | Enables the local model in development-style builds; `Release` builds register the native path regardless of this flag. |
| `GOOGLE_MAPS_API_KEY` | Native config generation | Used by the Android native map config. It is not currently wired to an iOS Google Maps setup in this repo. |

### Backend runtime scope

These live in DigitalOcean App Platform service env vars or `backend/.env` locally:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend runtime secret | Prisma connection string for Postgres. |
| `PORT` | Backend runtime | Port the Express server listens on. App Platform injects this. |
| `CORS_ORIGIN` | Backend runtime | Allowed browser origin list. `*` is acceptable for this demo backend. |
| `GROQ_API_KEY` | Backend runtime secret | Required API key for coupon generation. |
| `GROQ_MODEL` | Backend runtime | Groq model name. |
| `GROQ_BASE_URL` | Backend runtime | Groq-compatible OpenAI base URL. |
| `SEED_DEMO_DATA` | Backend startup runtime | When `true`, seeds demo merchants during container startup after migrations. |

## Repo Notes

- [backend/README.md](/Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/backend/README.md) contains backend-specific run and deploy details.
- [city_wallet/README.md](/Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/city_wallet/README.md) contains app-specific local build notes.
