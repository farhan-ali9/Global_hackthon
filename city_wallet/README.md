# City Wallet App

Expo Go-compatible mobile app for the City Wallet demo. The app collects
device-side context, ranks nearby merchants, and calls the backend to generate
Groq-powered coupons.

## Running Locally

```bash
npm install
npm start
```

Open the project with Expo Go from the Metro output.

The `development` EAS build profile is also Metro-based and intended for local
debugging.

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Default:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_ON_DEVICE_MODEL_ID=Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf
EXPO_PUBLIC_ENABLE_LOCAL_MODEL=false
```

For the always-on mobile app, create a preview env file from the template and
replace the API URL with your DigitalOcean App Platform URL:

```bash
cp .env.preview.example .env.preview
```

If `EXPO_PUBLIC_API_BASE_URL` is omitted, the app attempts to derive the backend
host from the Expo/Metro host in development, then falls back to simulator and
emulator defaults. For Expo Go on a physical device, explicitly using your
computer's LAN IP is still the most predictable setup:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000
```

## Structure

- `app/_layout.tsx` - Starts the app-wide user-context coupon loop.
- `app/index.tsx` - Onboarding entry point for the wallet demo.
- `app/offers/[id].tsx` - Plain offer detail and accept action.
- `app/redeem/[id].tsx` - Plain redemption token/status screen.
- `src/context-engine/ContextProvider.ts` - Device context provider for
  location, time, weather placeholder, and derived intent signals.
- `src/context-engine/LocalMerchantRecommender.ts` - Adapter boundary and
  fallback logic for local merchant ranking.
- `src/context-engine/ReactNativeAiMerchantModelClient.native.ts` - Native
  React Native AI/GGUF merchant-selection model client for custom dev builds.
- `src/context-engine/UserContextLoopProvider.tsx` - App-wide 10-second loop
  that refreshes context, fetches merchants, and asks the local model/fallback
  to choose a merchant.
- `src/lib/api.ts` - Backend API client.
- `src/lib/demoState.ts` - In-memory handoff between demo screens.
- `src/storage/userProfileStorage.ts` - SQLite-backed local onboarding profile
  storage, including the display name shown on the home screen.
- `src/types/city-wallet.ts` - API contracts shared by the mobile app.

## Context Coupon Loop

The root layout wraps the app in `UserContextLoopProvider`. On mount, and then
every 10 seconds, the provider:

1. Builds a `UserContext` with precise coordinates, local time, timezone,
   coordinate-derived city/zone ids, weather bucket/details, stored onboarding
   profile answers, intent labels, and demand tags.
2. Calls `GET /merchants?cityId=<id>` to retrieve merchant candidates for the
   user's broad city.
3. Calls `recommendMerchant({ context, merchants })` in
   `LocalMerchantRecommender.ts`. Native builds register the React Native
   AI/GGUF implementation at app startup when
   `EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true`; Expo Go, web, and unconfigured dev
   builds use the deterministic nearest-merchant fallback.
4. Calls `POST /coupons/generate` with `{ merchantId, userIntent, context }` so
   the backend can generate a typed coupon through Groq.

## Always-On Preview Build

Use the `preview` EAS profile for a real installable app that works without
Metro or the same local network. The profile is internal distribution, uses the
`preview` EAS Update channel, and enables the local native model in the build
environment.

Set the DigitalOcean API URL in EAS before building:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_API_BASE_URL --value https://<your-app>.ondigitalocean.app --visibility plaintext
eas env:create --environment preview --name GOOGLE_MAPS_API_KEY --value <your-google-maps-key> --visibility sensitive
```

Build and install:

```bash
eas build --profile preview --platform all
```

Publish JS-only fixes to installed preview builds:

```bash
eas update --channel preview --message "Describe the update"
```

## How to Work With It

- Keep UI minimal until the backend/context path is stable.
- Backend work happens in `../backend/`; the app only calls the API.
- Context work should replace the placeholder weather provider with a real local
  or API-backed weather source.
- Add new supported city bounding boxes in `ContextProvider.ts` when the backend
  is seeded with additional `cityId` values.
- Native AI work requires a custom Expo dev build or prebuild with
  `EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true` because Expo Go cannot load the
  llama.rn native module.
- Backend generation returns typed coupon JSON, not remote executable UI code.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

## Current Scope

This scaffold does not yet implement real context signals or production push
notification delivery.
