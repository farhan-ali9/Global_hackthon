# City Wallet App

This app is meant to be built locally from Xcode for iPhone demos and pointed at
the deployed DigitalOcean backend.

## Local Commands

Install dependencies and sync iOS pods:

```bash
cd /Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/city_wallet
npm install
npx pod-install
```

Start Metro for debug-only work:

```bash
npm start
```

Open the iOS workspace:

```bash
open ios/citywallet.xcworkspace
```

## Xcode Demo Build

1. Create `city_wallet/.env` from `.env.example`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to your DigitalOcean backend URL.
3. Open the workspace in Xcode.
4. Select your personal signing team.
5. Use a `Release` scheme build for the demo.
6. Install to your iPhone from Xcode.

For a standalone demo build, Metro must not be part of the dependency path. Use
`Release`, not `Debug`.

## Network Behavior

- `Release` build:
  the phone talks directly to `EXPO_PUBLIC_API_BASE_URL`
- `Debug` build:
  the phone talks to Metro on your laptop and is only suitable for development

## App Env Vars

These are build-time values. Change them in `.env`, then rebuild from Xcode.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL used by the app. |
| `EXPO_PUBLIC_ON_DEVICE_MODEL_ID` | GGUF model identifier for the native on-device recommender. |
| `EXPO_PUBLIC_ENABLE_LOCAL_MODEL` | Mainly relevant for development builds. |
| `GOOGLE_MAPS_API_KEY` | Android native map key. |

## Current Flow

1. The app builds private context on device.
2. It fetches merchant candidates from the backend.
3. It ranks merchants locally.
4. It requests coupon generation from the backend.
5. The backend returns typed coupon JSON for rendering.

The backend contract lives in [api.ts](/Users/davidklingbeil2/Documents/Hackathon/Global_hackthon/city_wallet/src/lib/api.ts:1).
