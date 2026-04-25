import type {
  CityConfig,
  ContextSnapshot,
  GeneratedOffer,
  Merchant,
  MerchantRule,
  Redemption,
} from "@/src/types/city-wallet";

export const demoCity: CityConfig = {
  id: "stuttgart-demo",
  name: "Configurable Demo City",
  countryCode: "DE",
  center: {
    latitude: 48.7758,
    longitude: 9.1829,
  },
  enabledSignals: ["location", "weather", "time", "demand"],
};

export const demoMerchant: Merchant = {
  id: "merchant-cafe-mueller",
  name: "Cafe Mueller",
  category: "cafe",
  distanceMeters: 80,
  demandState: "quiet",
};

export const demoRule: MerchantRule = {
  id: "rule-cafe-mueller",
  merchantId: demoMerchant.id,
  goal: "Fill quiet lunch windows without discounting above the merchant cap.",
  maxDiscountPercent: 20,
  quietHours: "11:00-14:00",
};

export const demoContextSnapshot: ContextSnapshot = {
  id: "context-demo-lunch",
  cityId: demoCity.id,
  weather: "overcast",
  temperatureCelsius: 11,
  timeOfDay: "lunch",
  locationLabel: "Old town walking route",
  demandSignal: "Nearby cafe transaction density is unusually low",
  generatedAt: new Date("2026-04-25T11:48:00.000Z").toISOString(),
};

export const demoOffer: GeneratedOffer = {
  id: "offer-warm-cappuccino",
  merchantId: demoMerchant.id,
  title: "Warm up nearby",
  hook: "11 C and overcast. Cafe Mueller has a fresh cappuccino waiting 80 m away.",
  discountPercent: 15,
  reason: "Weather, lunch timing, proximity, and quiet merchant demand matched.",
  expiresAt: new Date("2026-04-25T12:03:00.000Z").toISOString(),
  status: "generated",
};

export const demoRedemption: Redemption = {
  id: "redemption-demo",
  offerId: demoOffer.id,
  merchantId: demoMerchant.id,
  token: "CITY-1548",
  status: "pending",
};
