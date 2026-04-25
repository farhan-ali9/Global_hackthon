# City Wallet App

Expo Go-compatible mobile app for the City Wallet demo. The app sends
anonymized context to the backend, shows the returned GenUI offer payload,
accepts the offer, and displays a redemption token.

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

- `app/index.tsx` - Sends anonymized context and shows returned GenUI JSON.
- `app/offers/[id].tsx` - Plain offer detail and accept action.
- `app/redeem/[id].tsx` - Plain redemption token/status screen.
- `src/context-engine/ContextProvider.ts` - Mock local anonymized-context
  provider.
- `src/lib/api.ts` - Backend API client.
- `src/lib/demoState.ts` - In-memory handoff between demo screens.
- `src/types/city-wallet.ts` - API contracts shared by the mobile app.

## How to Work With It

- Keep UI minimal until the backend/context path is stable.
- Backend work happens in `../backend/`; the app only calls the API.
- Context work should replace `mockContextProvider` with location, weather,
  events, demand signals, and local-model anonymization.
- AI work on-device should output `AnonymizedContextPayload`.
- Backend generation returns safe typed GenUI JSON, not remote executable UI
  code.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

## Current Scope

This scaffold does not yet implement real context signals, push notifications,
QR rendering, or React Native AI native modules.
