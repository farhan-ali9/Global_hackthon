# Changelog

## 2026-04-26

### Frontend app-wide context coupon loop
- Saved the onboarding display name as a first-class SQLite profile field and
  used it for the home screen greeting/avatar.
- Added SQLite-backed onboarding profile persistence on the client and included
  the stored profile in the local merchant-selection context.
- Extended backend coupon generation to accept local-model user intent and
  return merchant details plus percentage- or amount-based saving information.
- Added a City Wallet context engine that refreshes user context every 10
  seconds with coordinates, current time, timezone, weather placeholder, intent
  labels, and demand tags.
- Added frontend API calls for `GET /merchants?cityId=...` and
  `POST /coupons/generate`.
- Wired the local-model recommendation loop to call `POST /coupons/generate`
  with selected `merchantId` plus derived `userIntent`, aligned mobile coupon
  types with backend `saving` payload, and surfaced generated coupon details in
  Home and Coupons tabs.
- Split local-model inference into two prompts: one for merchant selection and
  one for `userIntent` generation, then sent both outputs to coupon generation.
- Kept coupon generation inside the 10-second context loop and stored the
  generated coupon only in frontend in-memory state (RAM) for rendering on the
  Coupons tab, with no coupon persistence in any database.
- Updated the frontend loop to append every newly generated coupon into a
  rolling in-memory history and render that running feed in the Coupons tab so
  users immediately see each new coupon as it is generated.
- Removed the mock merchant-pipeline coupon rendering from the Coupons tab and
  now show only the generated coupon list coming from the 10-second context
  loop.
- Wired the Profile tab to read display name, city, avatar color, and member
  since year from SQLite-backed profile storage instead of hardcoded defaults.
- Removed OpenRouter from coupon generation and switched backend coupon
  generation to Gemini-only using `GEMINI_API_KEY` and `GEMINI_MODEL`.
- Added a local merchant recommender adapter for React Native AI/GGUF model
  integration and wired the app root to select a merchant locally before coupon
  generation.
- Derived frontend `cityId` and `zoneId` from device coordinates using
  configured city bounds instead of a direct hardcoded assignment.
- Replaced the demo city with Linz, Austria (`linz-demo`) across frontend
  context defaults, map mock pins, and backend merchant seed data.

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
- Seeded the initial merchant dataset with 6 mock demo merchants, each with a
  markdown `rules` block.
- New env vars: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.
