import { z } from "zod";

export const merchantListQuerySchema = z.object({
  cityId: z.string().min(1).optional(),
});

export const couponRequestSchema = z.object({
  merchantId: z.string().min(1),
  context: z.record(z.string(), z.unknown()),
});

export const llmCouponPayloadSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  discountPercent: z.number().int().min(0).max(100),
  ctaLabel: z.string().min(1),
  explanationTags: z.array(z.string()).default([]),
});

export type LlmCouponPayload = z.infer<typeof llmCouponPayloadSchema>;
