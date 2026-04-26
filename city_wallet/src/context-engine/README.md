# Context Engine

The context engine owns device-side context collection and local merchant
selection for City Wallet.

## Flow

1. `ContextProvider.ts` builds a `UserContext` from device location, current
   time, timezone, coordinate-derived city/zone ids, weather, the locally stored
   onboarding profile, and derived intent/demand signals.
2. `UserContextLoopProvider.tsx` refreshes that context every 10 seconds,
   fetches merchants for the user's `cityId`, asks the local recommender to
   pick a merchant plus generate `userIntent` in a separate local-model prompt,
   then requests a coupon from the backend with
   `{ merchantId, userIntent, context }`.
3. Each generated coupon is pushed into an in-memory coupon history in the loop
   provider (RAM only, no persistence/database write). The latest coupon is also
   exposed directly, and `app/(tabs)/coupons.tsx` renders the running coupon
   feed from that generated list.
4. `LocalMerchantRecommender.ts` is the adapter boundary for local merchant
   ranking. Native builds register `ReactNativeAiMerchantModelClient.native.ts`,
   which downloads the configured GGUF model on first use and runs it through
   React Native AI/llama.rn. Web and test builds keep the deterministic fallback.

Precise coordinates and the onboarding profile are used for local merchant
selection. The backend coupon request receives a reduced context payload without
raw GPS coordinates, plus the local-model user intent and picked merchant id.

`cityId` is resolved from configured coordinate bounds. At the moment, the only
backend-seeded city is `linz-demo`, so coordinates outside configured bounds
fall back to that demo city.

## Native GGUF model

Set `EXPO_PUBLIC_ON_DEVICE_MODEL_ID` to a Hugging Face GGUF id in the form
`owner/repo/filename.gguf`. The default is
`Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf`.

The native runtime requires a custom Expo dev build or prebuild. Expo Go cannot
load the llama.rn native module.
