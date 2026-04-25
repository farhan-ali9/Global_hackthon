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

export type CouponCategory = "food" | "retail" | "entertainment" | "wellness" | "transport";

export type Coupon = {
  id: string;
  company: string;
  logoLetter: string;
  brandColor: string;
  accentColor: string;
  category: CouponCategory;
  offer: string;
  offerDetail: string;
  location: string;
  distanceMeters: number;
  validUntil: string;
  token: string;
  status: "active" | "redeemed" | "expired";
  redeemedAt?: string;
  savings?: string;
};

/* ── Context engine types ── */

export type TimeOfDay = "morning" | "lunch" | "afternoon" | "evening";
export type WeatherBucket = "clear" | "cloudy" | "rain" | "cold" | "hot";
export type Coordinates = {
  latitude: number;
  longitude: number;
};

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

export type WeatherSituation = {
  bucket: WeatherBucket;
  label: string;
  temperatureCelsius?: number;
  precipitationProbability?: number;
  source: "placeholder" | "device" | "weather_api";
};

export type UserContext = {
  cityId: string;
  zoneId: string;
  coordinates: Coordinates;
  coordinateAccuracyMeters?: number;
  currentTimeIso: string;
  timezone: string;
  locale: string;
  dayOfWeek: string;
  isWeekend: boolean;
  timeOfDay: TimeOfDay;
  weatherBucket: WeatherBucket;
  weather: WeatherSituation;
  intentLabels: IntentLabel[];
  eventTags: string[];
  demandTags: string[];
  mobilityState: "stationary" | "walking" | "commuting" | "unknown";
  privacyLevel: "device_precise";
};

export type AnonymizedContextPayload = UserContext;

export type MerchantSummary = {
  id: string;
  description: string;
  cityId: string;
  coordinates: Coordinates;
};

export type LocalRecommendationRequest = {
  context: UserContext;
  merchants: MerchantSummary[];
};

export type LocalRecommendationResponse = {
  merchantId: string;
  confidence?: number;
  reasoningTags?: string[];
};

export type GenerateCouponRequest = {
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
