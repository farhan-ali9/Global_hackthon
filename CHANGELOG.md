# Changelog

## 2026-04-26

### Frontend app-wide context coupon loop
- Added a City Wallet context engine that refreshes user context every 10
  seconds with coordinates, current time, timezone, weather placeholder, intent
  labels, and demand tags.
- Added frontend API calls for `GET /merchants?cityId=...` and
  `POST /coupons/generate`.
- Added a local merchant recommender adapter for React Native AI/GGUF model
  integration and wired the app root to select a merchant locally before coupon
  generation.

## 2026-04-25

### Backend rebuilt around merchants + LLM coupon generation
- Replaced the speculative offer/redemption scaffolding with a single
  `Merchant` model (`id`, `description`, `cityId`, `latitude`, `longitude`,
  `rules` markdown). Removed the `MerchantRule`, `DemandSignal`, `Offer`,
  and `Redemption` tables and their enums.
- Replaced the init migration with a single fresh one matching the new
  schema.
- Removed endpoints: `POST /offers/generate`, `POST /offers/:offerId/accept`,
  `GET /redemptions/:token`, `POST /redemptions/:token/validate`. Removed
  the deterministic offer generator.
- Added `GET /merchants?cityId=...` returning `{id, description, cityId,
  coordinates}` summaries (no `rules` leaked).
- Added `POST /coupons/generate` accepting `{merchantId, context}` and
  calling OpenRouter via built-in `fetch` with the merchant's markdown
  rules as authoritative system-prompt constraints. No DB persistence.
- Reseeded with 6 mock Linz merchants (cafe, bistro, bookshop,
  gelateria, museum shop, bike rental), each with a markdown `rules`
  block.
- New env vars: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.
