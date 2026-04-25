/* ── Legacy domain types used by mock data & screens ── */

export type CityConfig = {
  id: string;
  name: string;
  countryCode: string;
  center: { latitude: number; longitude: number };
  enabledSignals: string[];
};

export type Merchant = {
  id: string;
  name: string;
  category: string;
  distanceMeters: number;
  demandState: string;
};

export type MerchantRule = {
  id: string;
  merchantId: string;
  goal: string;
  maxDiscountPercent: number;
  quietHours: string;
};

export type ContextSnapshot = {
  id: string;
  cityId: string;
  weather: string;
  temperatureCelsius: number;
  timeOfDay: string;
  locationLabel: string;
  demandSignal: string;
  generatedAt: string;
};

export type GeneratedOffer = {
  id: string;
  merchantId: string;
  title: string;
  hook: string;
  discountPercent: number;
  reason: string;
  expiresAt: string;
  status: string;
};

export type Redemption = {
  id: string;
  offerId: string;
  merchantId: string;
  token: string;
  status: string;
};

/* ── Context engine types ── */

export type TimeOfDay = "morning" | "lunch" | "afternoon" | "evening";
export type WeatherBucket = "clear" | "cloudy" | "rain" | "cold" | "hot";
export type IntentLabel =
  | "browsing"
  | "hungry"
  | "seeking_warmth"
  | "commuting"
  | "social";

export type AnonymizedContextPayload = {
  cityId: string;
  zoneId: string;
  timeOfDay: TimeOfDay;
  weatherBucket: WeatherBucket;
  intentLabels: IntentLabel[];
  eventTags: string[];
  demandTags: string[];
};

export type OfferUiSpec = {
  component: "offer_card_v1";
  tone: "warm" | "fresh" | "focused" | "neutral";
  headline: string;
  body: string;
  ctaLabel: string;
  badges: string[];
  colorTokens: {
    background: string;
    accent: string;
  };
  actions: {
    id: "accept_offer" | "decline_offer" | "open_redeem";
    label: string;
    type: "primary" | "secondary";
  }[];
};

export type GeneratedOfferResponse = {
  offer: {
    id: string;
    merchant: {
      id: string;
      name: string;
      category: string;
      distanceMeters: number;
    };
    discountPercent: number;
    expiresAt: string;
    status: "generated" | "accepted" | "declined" | "expired" | "redeemed";
    explanationTags: string[];
  };
  ui: OfferUiSpec;
};

export type RedemptionResponse = {
  token: string;
  offerId: string;
  merchantId: string;
  status: "pending" | "redeemed" | "expired";
  expiresAt: string;
};
