export type TimeOfDay = "morning" | "lunch" | "afternoon" | "evening";
export type WeatherBucket = "clear" | "cloudy" | "rain" | "cold" | "hot";
export type IntentLabel =
  | "browsing"
  | "hungry"
  | "seeking_warmth"
  | "commuting"
  | "social";

export type MerchantCategory = "cafe" | "restaurant" | "retail" | "culture";
export type DemandState = "quiet" | "normal" | "busy";

export type OfferIntent = {
  cityId: string;
  timeOfDay: TimeOfDay;
  weatherBucket: WeatherBucket;
  intentLabels: IntentLabel[];
  eventTags: string[];
  demandTags: string[];
};

export type SelectedOfferRequest = {
  merchantId: string;
  intent: OfferIntent;
};

export type MerchantCandidate = {
  id: string;
  name: string;
  category: MerchantCategory;
  cityId: string;
  zoneId: string;
  distanceMeters: number;
  rule: {
    maxDiscountPercent: number;
    quietHours: string;
  } | null;
  demand: {
    state: DemandState;
    score: number;
    observedAt: string;
  } | null;
};

export type MerchantSummary = {
  id: string;
  description: string;
  cityId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type CouponRequest = {
  merchantId: string;
  context: Record<string, unknown>;
};

export type GeneratedCouponResponse = {
  merchantId: string;
  headline: string;
  body: string;
  discountPercent: number;
  ctaLabel: string;
  expiresAt: string;
  explanationTags: string[];
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
