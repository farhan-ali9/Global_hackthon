import { z } from "zod";

export const merchantListQuerySchema = z.object({
  cityId: z.string().min(1).optional(),
});

export const couponRequestSchema = z.object({
  merchantId: z.string().min(1),
  context: z.record(z.string(), z.unknown()),
  userIntent: z.string().min(1),
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
