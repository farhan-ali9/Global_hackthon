# City Wallet App

Custom Expo dev-build mobile app for the City Wallet demo. The app prepares an
on-device Llama model, fetches backend merchant candidates, ranks them locally,
sends only the selected merchant id and coarse intent to the backend, shows the
returned GenUI offer payload, accepts the offer, and displays a redemption
token.

## Running Locally

```bash
npm install
npm run ios
```

Use `npm run android` for Android. After creating a dev client, use:

```bash
npm start
```

Expo Go is not sufficient because the Llama provider depends on native modules.

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Default:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_DEFAULT_CITY_ID=stuttgart-demo
EXPO_PUBLIC_ON_DEVICE_MODEL_ID=Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

For a physical device, use your computer's LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000
```

## Structure

- `app/index.tsx` - Controls model download/prepare, candidate loading, local
  ranking, and selected-offer generation.
- `app/offers/[id].tsx` - Plain offer detail and accept action.
- `app/redeem/[id].tsx` - Plain redemption token/status screen.
- `src/ai/` - On-device Llama lifecycle, structured intent extraction, and
  local ranking pipeline.
- `src/context-engine/ContextProvider.ts` - Boundary for future private local
  signal capture.
- `src/lib/api.ts` - Backend API client.
- `src/lib/demoState.ts` - In-memory handoff between demo screens.
- `src/types/city-wallet.ts` - API contracts shared by the mobile app.

## How to Work With It

- Keep UI minimal until the backend/context path is stable.
- Backend work happens in `../backend/`; the app only calls the API.
- Context work should provide private local signals to
  `src/ai/onDeviceLlamaPipeline.ts`.
- AI work on-device should output `OfferIntent` and a selected merchant id.
- Do not add raw private context to backend requests.
- Backend generation returns safe typed GenUI JSON, not remote executable UI
  code.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

## Current Scope

This scaffold does not yet implement real context-signal capture, model
fine-tuning, bundled model files, push notifications, or QR rendering.
