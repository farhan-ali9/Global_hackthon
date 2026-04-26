# City Wallet App

Expo Go-compatible mobile app for the City Wallet demo. The app collects
device-side context, ranks nearby merchants locally, and asks the backend to
generate a coupon for the selected merchant.

## Running Locally

```bash
npm install
npm start
```

Open the project with Expo Go from the Metro output.

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Default:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

For Expo Go on a physical device, use your computer's LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000
```

## Structure

- `app/_layout.tsx` - Starts the app-wide user-context coupon loop.
- `app/index.tsx` - Onboarding entry point for the wallet demo.
- `app/offers/[id].tsx` - Plain offer detail and accept action.
- `app/redeem/[id].tsx` - Plain redemption token/status screen.
- `src/context-engine/ContextProvider.ts` - Device context provider for
  location, time, weather, stored onboarding profile, and derived intent signals.
- `src/context-engine/LocalMerchantRecommender.ts` - Adapter boundary for the
  React Native AI/GGUF merchant-selection model.
- `src/context-engine/UserContextLoopProvider.tsx` - App-wide 10-second loop
  that refreshes context, fetches merchants, asks the local model to choose a
  merchant, and requests backend coupon generation.
- `src/lib/api.ts` - Backend API client.
- `src/lib/demoState.ts` - In-memory handoff between demo screens.
- `src/storage/userProfileStorage.ts` - SQLite-backed local onboarding profile
  storage.
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
   `LocalMerchantRecommender.ts`. Register the React Native AI/GGUF
   implementation with `setLocalMerchantModelClient(...)`. The local model
   receives the stored onboarding profile as part of the context payload.
4. Calls `POST /coupons/generate` with the selected `merchantId` and a reduced
   context payload. Precise coordinates stay on device for local ranking.

## How to Work With It

- Keep UI minimal until the backend/context path is stable.
- Backend work happens in `../backend/`; the app only calls the API.
- Context work should replace the placeholder weather provider with a real local
  or API-backed weather source.
- Add new supported city bounding boxes in `ContextProvider.ts` when the backend
  is seeded with additional `cityId` values.
- AI work on-device should implement the `LocalMerchantModelClient` contract and
  return a merchant id from the candidate list.
- Backend generation returns typed coupon JSON, not remote executable UI code.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

## Current Scope

This scaffold does not yet implement real context signals, push notifications,
QR rendering, or React Native AI native modules.
