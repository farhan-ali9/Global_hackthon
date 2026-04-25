import { z } from "zod";

export const anonymizedContextSchema = z.object({
  cityId: z.string().min(1),
  zoneId: z.string().min(1),
  timeOfDay: z.enum(["morning", "lunch", "afternoon", "evening"]),
  weatherBucket: z.enum(["clear", "cloudy", "rain", "cold", "hot"]),
  intentLabels: z
    .array(z.enum(["browsing", "hungry", "seeking_warmth", "commuting", "social"]))
    .default([]),
  eventTags: z.array(z.string()).default([]),
  demandTags: z.array(z.string()).default([]),
});
