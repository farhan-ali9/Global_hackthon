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
