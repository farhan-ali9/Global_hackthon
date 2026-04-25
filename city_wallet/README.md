# City Wallet App

Expo Go-compatible mobile app scaffold for the Generative City Wallet hackathon
project. It currently uses mock data and placeholder interfaces so different
team members can work on backend, context, AI, and UI without blocking each
other.

## Running Locally

```bash
npm install
npm start
```

Open the project with Expo Go from the Metro output.

## Environment

Firebase is initialized with the Firebase JS SDK for Expo Go compatibility.
Create a local `.env` file from `.env.example` when Firebase credentials are
available:

```bash
cp .env.example .env
```

Only `EXPO_PUBLIC_FIREBASE_*` variables are expected in this first pass.

## Structure

- `app/index.tsx` - Consumer home with one mock generated offer.
- `app/offers/[id].tsx` - Offer detail screen.
- `app/redeem/[id].tsx` - Placeholder redemption token/QR screen.
- `app/merchant/dashboard.tsx` - Merchant performance mock dashboard.
- `app/merchant/rules.tsx` - Merchant rule/guardrail mock screen.
- `src/components/` - Shared UI building blocks.
- `src/data/mockData.ts` - Temporary data for the scaffold.
- `src/types/city-wallet.ts` - Shared domain types.
- `src/lib/firebase.ts` - Firebase app and Firestore initialization.
- `src/lib/firebaseRepositories.ts` - Backend stubs for future Firestore work.
- `src/context-engine/ContextProvider.ts` - Context provider interface and mock.
- `src/ai/OfferGenerator.ts` - Offer generator interface and mock.

## How to Work With It

- UI work should add screens under `app/` and reusable pieces under
  `src/components/`.
- Backend work should replace the stub functions in `src/lib/` with Firestore
  reads and writes.
- Context work should replace `mockContextProvider` with location, weather,
  events, and demand signal processing.
- AI work should replace `mockOfferGenerator` with a real generation adapter.
  Keep this Expo Go-safe until the team intentionally moves to a development
  build for native on-device model support.
- Shared data contracts should be added to `src/types/city-wallet.ts` before
  being used across screens or services.

## Checks

```bash
npm run lint
npx tsc --noEmit
```

## Current Scope

This scaffold does not yet implement real Firestore persistence, real context
signals, push notifications, QR validation, or React Native AI native modules.
