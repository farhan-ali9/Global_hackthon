import type { CouponSaving } from "./schemas";

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
  userIntent?: string;
  merchantRules?: string;
};

export type CouponMerchant = {
  id: string;
  description: string;
  cityId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type GeneratedCouponResponse = {
  merchantId: string;
  merchant: CouponMerchant;
  headline: string;
  body: string;
  saving: CouponSaving;
  discountPercent?: number;
  ctaLabel: string;
  expiresAt: string;
  explanationTags: string[];
  userIntent?: string;
};
