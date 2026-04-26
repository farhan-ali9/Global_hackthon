import type { PrismaClient } from "@prisma/client";

import { llmCouponPayloadSchema, type LlmCouponPayload } from "../schemas";
import type { CouponRequest, GeneratedCouponResponse } from "../types";

export type LlmCouponGenerator = {
  generate: (request: CouponRequest) => Promise<GeneratedCouponResponse>;
};

export type LlmCouponGeneratorConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const COUPON_TTL_MS = 15 * 60 * 1000;

const SYSTEM_PROMPT = `You generate a single local coupon as JSON.

You must follow the merchant rules verbatim. The merchant rules are
authoritative — never exceed the maximum discount, never violate the
restrictions, and always respect the requested tone.

Respond with a single JSON object matching exactly this schema, with no
extra keys, no prose, and no markdown fences:

{
  "headline": string,            // <= 60 chars, the coupon title
  "body": string,                // 1-2 sentences explaining the offer
  "discountPercent": integer,    // 0-100, capped by merchant rules
  "ctaLabel": string,            // <= 24 chars, e.g. "Redeem now"
  "explanationTags": string[]    // 2-5 short tags justifying the offer
}`;

export function createLlmCouponGenerator(
  prisma: PrismaClient,
  config: LlmCouponGeneratorConfig,
): LlmCouponGenerator {
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    async generate({ merchantId, context }) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { rule: true },
      });

      if (!merchant) {
        throw httpError(404, `Merchant ${merchantId} not found`);
      }

      if (!config.apiKey) {
        return buildLocalFallbackCoupon(merchant, context);
      }

      const payload = await callOpenRouter({
        baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        system: `${SYSTEM_PROMPT}\n\n--- Merchant rules (authoritative) ---\n${merchant.rules ?? ""}`,
        user: buildUserMessage(merchant, context),
      });

      return {
        merchantId: merchant.id,
        headline: payload.headline,
        body: payload.body,
        discountPercent: payload.discountPercent,
        ctaLabel: payload.ctaLabel,
        explanationTags: payload.explanationTags,
        expiresAt: new Date(Date.now() + COUPON_TTL_MS).toISOString(),
      };
    },
  };
}

function buildLocalFallbackCoupon(
  merchant: {
    id: string;
    name: string;
    description?: string | null;
    rule?: { maxDiscountPercent: number } | null;
  },
  context: Record<string, unknown>,
): GeneratedCouponResponse {
  const maxDiscountPercent = merchant.rule?.maxDiscountPercent ?? 10;
  const weatherBucket =
    typeof context.weatherBucket === "string" ? context.weatherBucket : "local";
  const timeOfDay =
    typeof context.timeOfDay === "string" ? context.timeOfDay : "now";
  const discountPercent = Math.min(maxDiscountPercent, 10);

  return {
    merchantId: merchant.id,
    headline: `Local offer at ${merchant.name || merchant.id}`,
    body: `${discountPercent}% off selected on-device for your ${timeOfDay} context and ${weatherBucket} conditions.`,
    discountPercent,
    ctaLabel: "Redeem now",
    explanationTags: ["local-selection", timeOfDay, weatherBucket],
    expiresAt: new Date(Date.now() + COUPON_TTL_MS).toISOString(),
  };
}

function buildUserMessage(
  merchant: {
    id: string;
    description?: string | null;
    cityId: string;
    latitude?: number | null;
    longitude?: number | null;
  },
  context: Record<string, unknown>,
) {
  return [
    `Merchant: ${merchant.description ?? merchant.id}`,
    `City: ${merchant.cityId}`,
    `Coordinates: ${merchant.latitude ?? 0}, ${merchant.longitude ?? 0}`,
    "",
    "User context (anonymised, device-supplied):",
    JSON.stringify(context, null, 2),
    "",
    "Generate the coupon JSON now.",
  ].join("\n");
}

type OpenRouterArgs = {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
};

async function callOpenRouter(args: OpenRouterArgs): Promise<LlmCouponPayload> {
  const response = await fetch(`${args.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw httpError(
      502,
      `OpenRouter request failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw httpError(502, "OpenRouter response missing message content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw httpError(502, "OpenRouter returned invalid JSON");
  }

  const result = llmCouponPayloadSchema.safeParse(parsed);
  if (!result.success) {
    throw httpError(502, "OpenRouter response did not match coupon schema");
  }
  return result.data;
}

function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}
