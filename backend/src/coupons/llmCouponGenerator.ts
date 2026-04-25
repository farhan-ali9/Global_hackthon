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
  if (!config.apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to start the coupon generator");
  }
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    async generate({ merchantId, context }) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        throw httpError(404, `Merchant ${merchantId} not found`);
      }

      const payload = await callOpenRouter({
        baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        system: `${SYSTEM_PROMPT}\n\n--- Merchant rules (authoritative) ---\n${merchant.rules}`,
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

function buildUserMessage(
  merchant: {
    id: string;
    description: string;
    cityId: string;
    latitude: number;
    longitude: number;
  },
  context: Record<string, unknown>,
) {
  return [
    `Merchant: ${merchant.description}`,
    `City: ${merchant.cityId}`,
    `Coordinates: ${merchant.latitude}, ${merchant.longitude}`,
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
