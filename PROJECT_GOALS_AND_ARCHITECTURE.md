# Project Goals And Architecture

## Goal

City Wallet should generate timely, relevant local offers while keeping the
user's most sensitive context on the device. The backend should help merchants
participate, enforce rules, generate the final offer, and manage redemption
without needing exact user location, raw movement behavior, or full profile
details.

The target demo flow should show that local context can drive a specific offer
without turning the backend into a store of private user context.

## Privacy Boundary

Private context stays on-device:

- precise location,
- current weather around the user,
- movement behavior,
- profile and preference signals,
- recent interaction history,
- live intent signals.

The backend should only receive coarse, purpose-specific inputs:

- city, zipcode, or broad area query,
- selected merchant id,
- abstract user intent,
- offer/redemption actions.

The backend should not receive exact GPS coordinates, raw movement traces, full
preference profiles, or local behavioral history.

## Core Flow

1. The device collects private context such as precise location, weather,
   movement behavior, profile/preferences, and live intent.
2. An on-device model or local context engine converts that private context into
   local ranking signals and an abstract intent.
3. The device asks the backend for merchants in a broad area such as city or
   zipcode. Exact user location is not sent.
4. The backend returns merchant candidates with non-user-private data such as
   merchant location, store type, rules, available discounts, broad eligibility,
   and ranking metadata.
5. The device combines merchant context with private user context to select the
   best merchant locally.
6. The device sends the backend an offer-generation request containing the
   selected merchant id and abstract user intent.
7. The backend generates the custom offer and typed GenUI payload within the
   merchant's rules and discount constraints.
8. The device renders the returned offer and handles acceptance/redemption.

## Tradeoffs

This flow gives stronger privacy than backend-side ranking because the backend
does not need exact location or raw behavioral context. It also avoids sending a
large set of fully generated offers to the device.

The cost is that the app owns more ranking responsibility. The backend must
return enough merchant metadata for local selection, while avoiding unnecessary
exposure of merchant strategy or sensitive business data.

The backend still controls the merchant database, campaign rules, discount
constraints, offer generation, and redemption, which keeps merchant-side logic
centralized and easier to deploy on DigitalOcean.

## Flexible Backend Response Options

The team can adjust how much merchant data the backend returns as the prototype
evolves:

- Merchant summaries only: smallest response, but limited local ranking quality.
- Merchant summaries plus rules and discounts: better ranking, more business
  metadata exposed to the app.
- Limited candidate shortlist by city or zipcode: lower payload and simpler app
  logic, but more backend influence over ranking.
- Lazy detail fetch: device receives summaries first, ranks likely candidates,
  then requests detailed rules for the top few merchants.

For now, the preferred direction is summaries plus enough rule/discount metadata
to support local ranking, while keeping the shape easy to reduce or expand.

## Project Ownership

`city_wallet/` owns:

- private context capture,
- on-device anonymization,
- local merchant ranking,
- final merchant selection,
- offer rendering,
- user acceptance and redemption screens.

`backend/` owns:

- merchant database,
- broad merchant lookup by city or zipcode,
- merchant rules and discount constraints,
- offer generation,
- redemption APIs,
- DigitalOcean deployment.

Shared contracts should define:

- broad merchant query,
- merchant candidate response,
- local ranking input shape,
- offer generation request,
- GenUI offer response,
- redemption token.

## Current Architecture Direction

The recommended architecture is a device-led selection model:

- backend returns eligible merchant candidates for a broad area,
- device ranks those candidates with private context,
- backend generates the final offer only after the device selects a merchant.

This keeps sensitive context local while preserving backend control over merchant
rules, offer creation, and redemption.
