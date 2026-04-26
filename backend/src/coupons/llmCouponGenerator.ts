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

const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const COUPON_TTL_MS = 15 * 60 * 1000;
const LOG_PREFIX = "[coupon-generator]";
const GEMINI_REQUEST_TIMEOUT_MS = 20_000;

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
  const geminiBaseUrl = (config.baseUrl ?? DEFAULT_GEMINI_BASE_URL).replace(/\/$/, "");

  return {
    async generate({ merchantId, context, userIntent }) {
      if (!config.apiKey) {
        console.error(`${LOG_PREFIX} missing GROQ_API_KEY`, {
          merchantId,
          model: config.model,
        });
        throw httpError(
          503,
          "Coupon generation is not configured: GROQ_API_KEY is missing",
        );
      }

      console.info(`${LOG_PREFIX} starting coupon generation`, {
        merchantId,
        provider: "gemini",
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

      const payload = await callLlmApi({
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

      await recordCouponGeneratedAnalytics(prisma, {
        merchantId: merchant.id,
        userIntent,
        discountPercent: generatedCoupon.discountPercent,
        saving: generatedCoupon.saving,
        context,
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

type GeminiArgs = {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  merchantId: string;
};

async function callLlmApi(args: OpenRouterArgs): Promise<LlmCouponPayload> {
  console.info(`${LOG_PREFIX} calling LLM API`, {
    merchantId: args.merchantId,
    model: args.model,
    baseUrl: args.baseUrl,
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${args.baseUrl}/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: args.system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: args.user }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error(`${LOG_PREFIX} Gemini unreachable`, {
      merchantId: args.merchantId,
      model: args.model,
      baseUrl: args.baseUrl,
      reason: isTimeout ? "timeout" : "network_error",
      error: error instanceof Error ? error.message : String(error),
    });
    throw httpError(
      502,
      isTimeout
        ? `Gemini request timed out after ${GEMINI_REQUEST_TIMEOUT_MS}ms`
        : "Gemini is unreachable from backend",
    );
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`${LOG_PREFIX} Gemini request failed`, {
      merchantId: args.merchantId,
      model: args.model,
      status: response.status,
      detail: truncate(detail, 1_000),
    });
    throw httpError(502, `Gemini request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    console.error(`${LOG_PREFIX} Gemini returned invalid response JSON`, {
      merchantId: args.merchantId,
      model: args.model,
      error: error instanceof Error ? error.message : String(error),
    });
    throw httpError(502, "Gemini returned invalid response JSON");
  }

  const content = extractGeminiContent(json);
  if (!content) {
    console.error(`${LOG_PREFIX} Gemini response missing content`, {
      merchantId: args.merchantId,
      model: args.model,
      responsePreview: truncate(stringifyForLog(json), 2_000),
    });
    throw httpError(
      502,
      "Gemini response missing content; check backend logs for upstream response details",
    );
  }

  return parseCouponPayloadFromContent({
    provider: "Gemini",
    content,
    merchantId: args.merchantId,
    model: args.model,
  });
}

function parseCouponPayloadFromContent(args: {
  provider: "Gemini";
  content: string;
  merchantId: string;
  model: string;
}) {
  const parsed = extractJsonPayload(args.content);
  if (parsed === null) {
    console.error(`${LOG_PREFIX} ${args.provider} returned invalid JSON`, {
      merchantId: args.merchantId,
      model: args.model,
      contentPreview: truncate(args.content, 1_000),
    });
    throw httpError(502, `${args.provider} returned invalid JSON`);
  }
  const result = llmCouponPayloadSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`${LOG_PREFIX} ${args.provider} response schema mismatch`, {
      merchantId: args.merchantId,
      model: args.model,
      issues: result.error.issues,
      payload: parsed,
    });
    throw httpError(
      502,
      `${args.provider} response did not match coupon schema: ${result.error.issues
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

function extractGeminiContent(value: unknown) {
  if (typeof value !== "object" || value === null || !("candidates" in value)) {
    return null;
  }

  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const firstCandidate = candidates[0];
  if (
    typeof firstCandidate !== "object" ||
    firstCandidate === null ||
    !("content" in firstCandidate)
  ) {
    return null;
  }

  const content = (firstCandidate as { content?: unknown }).content;
  if (typeof content !== "object" || content === null || !("parts" in content)) {
    return null;
  }

  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) {
    return null;
  }

  const textChunks = parts
    .map((part) => {
      if (typeof part === "object" && part !== null && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : null;
      }
      return null;
    })
    .filter((chunk): chunk is string => chunk !== null);

  return textChunks.length > 0 ? textChunks.join("\n") : null;
}

function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const jsonObjectMatch = candidate.match(/\{[\s\S]*\}/);
    if (!jsonObjectMatch) {
      return null;
    }
    try {
      return JSON.parse(jsonObjectMatch[0]) as unknown;
    } catch {
      return null;
    }
  }
}

function stringifyForLog(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function recordCouponGeneratedAnalytics(
  prisma: PrismaClient,
  args: {
    merchantId: string;
    userIntent: string;
    discountPercent: number | undefined;
    saving: GeneratedCouponResponse["saving"];
    context: Record<string, unknown>;
  },
) {
  const analyticsDelegate = (
    prisma as unknown as {
      merchantAnalyticsEvent?: {
        create: (input: {
          data: {
            merchantId: string;
            type: "COUPON_GENERATED";
            metadata: Prisma.InputJsonObject;
          };
        }) => Promise<unknown>;
      };
    }
  ).merchantAnalyticsEvent;

  if (!analyticsDelegate?.create) {
    console.warn(`${LOG_PREFIX} skipping coupon analytics event: delegate unavailable`);
    return;
  }

  try {
    await analyticsDelegate.create({
      data: {
        merchantId: args.merchantId,
        type: "COUPON_GENERATED",
        metadata: toJsonObject({
          userIntent: args.userIntent,
          discountPercent: args.discountPercent ?? null,
          saving: args.saving,
          context: args.context,
        }),
      },
    });
  } catch (error) {
    console.warn(`${LOG_PREFIX} failed to record coupon analytics event`, {
      merchantId: args.merchantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function missingGeminiConfigError(merchantId: string, model: string) {
  console.error(`${LOG_PREFIX} missing GEMINI_API_KEY`, { merchantId, model });
  return httpError(503, "Coupon generation is not configured: GEMINI_API_KEY is missing");
}
