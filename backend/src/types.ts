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
