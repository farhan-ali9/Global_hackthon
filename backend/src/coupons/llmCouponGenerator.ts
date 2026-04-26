import { Prisma, type PrismaClient } from "@prisma/client";

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
const LOG_PREFIX = "[coupon-generator]";

const SYSTEM_PROMPT = `You generate a single local coupon as JSON.

You must follow the merchant rules verbatim. The merchant rules are
authoritative — never exceed the maximum discount, never violate the
restrictions, and always respect the requested tone.

Respond with a single JSON object matching exactly this schema, with no
extra keys, no prose, and no markdown fences:

{
  "headline": string,            // <= 60 chars, the coupon title
  "body": string,                // 1-2 sentences explaining the offer
  "saving": {                    // choose the format allowed by merchant rules
    "type": "percentage",
    "value": number,             // 0-100, capped by merchant rules
    "displayText": string        // e.g. "15% off"
  } | {
    "type": "amount",
    "amount": number,            // non-negative, capped by merchant rules
    "currency": string,          // ISO 4217, e.g. "EUR"
    "displayText": string        // e.g. "5 EUR off"
  },
  "ctaLabel": string,            // <= 24 chars, e.g. "Redeem now"
  "explanationTags": string[]    // 2-5 short tags justifying the offer
}`;

export function createLlmCouponGenerator(
  prisma: PrismaClient,
  config: LlmCouponGeneratorConfig,
): LlmCouponGenerator {
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

  return {
    async generate({ merchantId, context, userIntent }) {
      if (!config.apiKey) {
        console.error(`${LOG_PREFIX} missing OPENROUTER_API_KEY`, {
          merchantId,
          model: config.model,
        });
        throw httpError(
          503,
          "Coupon generation is not configured: OPENROUTER_API_KEY is missing",
        );
      }

      console.info(`${LOG_PREFIX} starting coupon generation`, {
        merchantId,
        model: config.model,
        userIntent,
        contextKeys: Object.keys(context),
      });

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        console.warn(`${LOG_PREFIX} merchant not found`, { merchantId });
        throw httpError(404, `Merchant ${merchantId} not found`);
      }
      const { description, rules, latitude, longitude } = merchant;
      if (description === null || rules === null || latitude === null || longitude === null) {
        console.error(`${LOG_PREFIX} merchant missing required configuration`, {
          merchantId,
          hasDescription: description !== null,
          hasRules: rules !== null,
          hasLatitude: latitude !== null,
          hasLongitude: longitude !== null,
        });
        throw httpError(
          500,
          `Merchant ${merchantId} is missing required coupon configuration`,
          { expose: true },
        );
      }
      const configuredMerchant = {
        id: merchant.id,
        description,
        cityId: merchant.cityId,
        latitude,
        longitude,
        rules,
      };

      const payload = await callOpenRouter({
        baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        system: `${SYSTEM_PROMPT}\n\n--- Merchant rules (authoritative) ---\n${configuredMerchant.rules}`,
        user: buildUserMessage(configuredMerchant, context, userIntent),
        merchantId,
      });

      const generatedCoupon = {
        merchantId: merchant.id,
        merchant: {
          id: merchant.id,
          description: configuredMerchant.description,
          cityId: merchant.cityId,
          coordinates: {
            latitude: configuredMerchant.latitude,
            longitude: configuredMerchant.longitude,
          },
        },
        headline: payload.headline,
        body: payload.body,
        saving: payload.saving,
        discountPercent:
          payload.saving.type === "percentage"
            ? Math.round(payload.saving.value)
            : undefined,
        ctaLabel: payload.ctaLabel,
        explanationTags: payload.explanationTags,
        expiresAt: new Date(Date.now() + COUPON_TTL_MS).toISOString(),
        userIntent,
      };

      await prisma.merchantAnalyticsEvent.create({
        data: {
          merchantId: merchant.id,
          type: "COUPON_GENERATED",
          metadata: toJsonObject({
            userIntent: userIntent ?? null,
            discountPercent: generatedCoupon.discountPercent ?? null,
            saving: generatedCoupon.saving,
            context,
          }),
        },
      });

      console.info(`${LOG_PREFIX} coupon generated`, {
        merchantId,
        savingType: generatedCoupon.saving.type,
        discountPercent: generatedCoupon.discountPercent ?? null,
      });

      return generatedCoupon;
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
  userIntent: string,
) {
  return [
    `Merchant: ${merchant.description}`,
    `City: ${merchant.cityId}`,
    `Coordinates: ${merchant.latitude}, ${merchant.longitude}`,
    `Next user intent from local model: ${userIntent}`,
    "",
    "User context (anonymised, device-supplied):",
    JSON.stringify(context, null, 2),
    "",
    "Generate the coupon JSON now.",
  ]
    .join("\n");
}

type OpenRouterArgs = {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  merchantId: string;
};

async function callOpenRouter(args: OpenRouterArgs): Promise<LlmCouponPayload> {
  console.info(`${LOG_PREFIX} calling OpenRouter`, {
    merchantId: args.merchantId,
    model: args.model,
    baseUrl: args.baseUrl,
  });

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
    console.error(`${LOG_PREFIX} OpenRouter request failed`, {
      merchantId: args.merchantId,
      model: args.model,
      status: response.status,
      detail: truncate(detail, 1_000),
    });
    throw httpError(
      502,
      `OpenRouter request failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    console.error(`${LOG_PREFIX} OpenRouter returned invalid response JSON`, {
      merchantId: args.merchantId,
      model: args.model,
      error: error instanceof Error ? error.message : String(error),
    });
    throw httpError(502, "OpenRouter returned invalid response JSON");
  }

  const content = extractMessageContent(json);
  if (!content) {
    console.error(`${LOG_PREFIX} OpenRouter response missing content`, {
      merchantId: args.merchantId,
      model: args.model,
      responsePreview: truncate(stringifyForLog(json), 2_000),
    });
    throw httpError(
      502,
      "OpenRouter response missing message content; check backend logs for upstream response details",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error(`${LOG_PREFIX} OpenRouter returned invalid JSON`, {
      merchantId: args.merchantId,
      model: args.model,
      contentPreview: truncate(content, 1_000),
      error: error instanceof Error ? error.message : String(error),
    });
    throw httpError(502, "OpenRouter returned invalid JSON");
  }

  const result = llmCouponPayloadSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`${LOG_PREFIX} OpenRouter response schema mismatch`, {
      merchantId: args.merchantId,
      model: args.model,
      issues: result.error.issues,
      payload: parsed,
    });
    throw httpError(
      502,
      `OpenRouter response did not match coupon schema: ${result.error.issues
        .map((issue) => issue.message)
        .join("; ")}`,
    );
  }
  return result.data;
}

function httpError(
  statusCode: number,
  message: string,
  options: { expose?: boolean } = {},
) {
  return Object.assign(new Error(message), {
    expose: options.expose ?? statusCode < 500,
    statusCode,
  });
}

function toJsonObject(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function extractMessageContent(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    !("choices" in value) ||
    !Array.isArray(value.choices)
  ) {
    return null;
  }

  const [choice] = value.choices;
  if (
    typeof choice !== "object" ||
    choice === null ||
    !("message" in choice) ||
    typeof choice.message !== "object" ||
    choice.message === null ||
    !("content" in choice.message)
  ) {
    return null;
  }

  return typeof choice.message.content === "string"
    ? choice.message.content
    : null;
}

function stringifyForLog(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
