import { z } from "zod";

export const merchantListQuerySchema = z.object({
  cityId: z.string().min(1).optional(),
});

export const couponRequestSchema = z.object({
  merchantId: z.string().min(1),
  context: z.record(z.string(), z.unknown()),
  userIntent: z.string().min(1).optional(),
  merchantRules: z.string().min(1).optional(),
});

export const adminSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const adminLoginSchema = adminSignupSchema;

export const adminMerchantSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  cityId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const adminRuleSetSchema = z.object({
  maxDiscountPercent: z.number().int().min(0).max(100),
  allowedWindows: z.array(z.string().min(1)).default([]),
  exclusions: z.array(z.string().min(1)).default([]),
  tone: z.string().min(1),
  validityMinutes: z.number().int().min(1).max(1440),
  extraInstructions: z.string().default(""),
  active: z.boolean().default(true),
});

export const analyticsEventSchema = z.object({
  merchantId: z.string().min(1),
  type: z.enum(["RECOMMENDED", "COUPON_GENERATED", "COUPON_ACCEPTED", "COUPON_REDEEMED"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const couponSavingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percentage"),
    value: z.number().min(0).max(100),
    displayText: z.string().min(1),
  }),
  z.object({
    type: z.literal("amount"),
    amount: z.number().nonnegative(),
    currency: z.string().min(1),
    displayText: z.string().min(1),
  }),
]);

export const llmCouponPayloadSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  saving: couponSavingSchema,
  ctaLabel: z.string().min(1),
  explanationTags: z.array(z.string()).default([]),
});

export type CouponSaving = z.infer<typeof couponSavingSchema>;
export type LlmCouponPayload = z.infer<typeof llmCouponPayloadSchema>;
