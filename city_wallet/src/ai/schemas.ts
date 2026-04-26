import { z } from "zod";

export const timeOfDaySchema = z.enum([
  "morning",
  "lunch",
  "afternoon",
  "evening",
]);

export const weatherBucketSchema = z.enum([
  "clear",
  "cloudy",
  "rain",
  "cold",
  "hot",
]);

export const intentLabelSchema = z.enum([
  "browsing",
  "hungry",
  "seeking_warmth",
  "commuting",
  "social",
]);

export const offerIntentSchema = z.object({
  cityId: z.string().min(1),
  timeOfDay: timeOfDaySchema,
  weatherBucket: weatherBucketSchema,
  intentLabels: z.array(intentLabelSchema).default([]),
  eventTags: z.array(z.string()).default([]),
  demandTags: z.array(z.string()).default([]),
});

export const merchantRankingDecisionSchema = z.object({
  selectedMerchantId: z.string().min(1),
  rationale: z.string().min(1).max(300),
  ranking: z
    .array(
      z.object({
        merchantId: z.string().min(1),
        score: z.coerce.number().min(0).max(100),
        reasons: z.array(z.string()).max(3).default([]),
      }),
    )
    .min(1),
});

export const localRecommendationSchema = z.object({
  merchantId: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1).optional(),
  reasoningTags: z.array(z.string()).max(5).default([]),
});
