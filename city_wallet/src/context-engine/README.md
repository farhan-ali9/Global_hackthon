# Context Engine

The context engine owns device-side context collection and local merchant
selection for City Wallet.

## Flow

1. `ContextProvider.ts` builds a `UserContext` from device location, current
   time, timezone, placeholder weather, and derived intent/demand signals.
2. `UserContextLoopProvider.tsx` refreshes that context every 10 seconds,
   fetches merchants for the user's `cityId`, asks the local recommender to pick
   a merchant, and requests a coupon from the backend.
3. `LocalMerchantRecommender.ts` is the adapter boundary for the React Native
   AI/GGUF model. Register the real model client with
   `setLocalMerchantModelClient(...)`.

Precise coordinates are only used on device. The backend coupon request receives
a reduced context payload without raw GPS coordinates.
