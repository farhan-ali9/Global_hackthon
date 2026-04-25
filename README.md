# City Wallet Hackathon

City Wallet is an Expo Go app for the DSV-Gruppe Generative City Wallet challenge.
The app scaffold lives in `city_wallet/` and is set up for a simple consumer flow,
merchant flow, Firebase backend integration, context processing, and future
on-device AI offer generation.

## Start the App

```bash
cd city_wallet
npm install
npm start
```

Use Expo Go to open the app from the Metro output.

## Project Structure

- `city_wallet/app/` - Expo Router screens for the consumer and merchant flows.
- `city_wallet/src/components/` - Reusable UI components.
- `city_wallet/src/data/` - Temporary mock data used by the scaffold.
- `city_wallet/src/types/` - Shared City Wallet domain types.
- `city_wallet/src/lib/` - Firebase initialization and backend repository stubs.
- `city_wallet/src/context-engine/` - Placeholder context provider interface.
- `city_wallet/src/ai/` - Placeholder offer generator interface.

See `city_wallet/README.md` for app-specific details.
