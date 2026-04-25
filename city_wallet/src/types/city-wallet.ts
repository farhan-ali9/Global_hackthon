export type CityConfig = {
  id: string;
  name: string;
  countryCode: string;
  center: {
    latitude: number;
    longitude: number;
  };
  enabledSignals: ("location" | "weather" | "time" | "events" | "demand")[];
};

export type Merchant = {
  id: string;
  name: string;
  category: "cafe" | "restaurant" | "retail" | "culture";
  distanceMeters: number;
  demandState: "quiet" | "normal" | "busy";
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
  timeOfDay: "morning" | "lunch" | "afternoon" | "evening";
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
  status: "generated" | "accepted" | "declined" | "expired" | "redeemed";
};

export type Redemption = {
  id: string;
  offerId: string;
  merchantId: string;
  token: string;
  status: "pending" | "redeemed" | "expired";
};
