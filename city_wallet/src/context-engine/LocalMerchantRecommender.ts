import type {
  LocalRecommendationRequest,
  LocalRecommendationResponse,
  MerchantSummary,
} from "@/src/types/city-wallet";

export type LocalMerchantModelClient = {
  recommendMerchant: (
    request: LocalRecommendationRequest,
  ) => Promise<LocalRecommendationResponse>;
};

let localMerchantModelClient: LocalMerchantModelClient | null = null;
const LOCAL_MODEL_TIMEOUT_MS = 30_000;

export type LocalRankingSignal = {
  merchantId: string;
  distanceMeters: number;
};

export function setLocalMerchantModelClient(client: LocalMerchantModelClient) {
  localMerchantModelClient = client;
}

export async function recommendMerchant(
  request: LocalRecommendationRequest,
): Promise<LocalRecommendationResponse> {
  if (request.merchants.length === 0) {
    throw new Error("Cannot recommend a merchant from an empty merchant list");
  }

  if (localMerchantModelClient === null) {
    return getFallbackRecommendation(request);
  }

  try {
    const recommendation = await withTimeout(
      localMerchantModelClient.recommendMerchant(request),
      LOCAL_MODEL_TIMEOUT_MS,
    );

    return validateRecommendation(request, recommendation);
  } catch (error) {
    console.warn("Local merchant model failed; using fallback.", error);

    return getFallbackRecommendation(request, getFallbackReasoningTags(error));
  }
}

export function buildLocalModelPrompt(request: LocalRecommendationRequest) {
  return [
    "Rank the best local merchant for this private on-device user context.",
    "Use the user context, merchant summaries, and computed local ranking signals.",
    "Return JSON only with this shape:",
    "{\"merchantId\":\"...\",\"confidence\":0.0,\"reasoningTags\":[\"...\"],\"rankedMerchantIds\":[\"...\"]}",
    "merchantId must be one of the provided merchant ids. Do not include markdown or explanation text.",
    "",
    "User context:",
    JSON.stringify(request.context, null, 2),
    "",
    "Local ranking signals:",
    JSON.stringify(buildLocalRankingSignals(request), null, 2),
    "",
    "Merchants:",
    JSON.stringify(request.merchants, null, 2),
  ].join("\n");
}

export function buildLocalRankingSignals(
  request: LocalRecommendationRequest,
): LocalRankingSignal[] {
  return request.merchants
    .map((merchant) => ({
      merchantId: merchant.id,
      distanceMeters: distanceToUserMeters(merchant, request),
    }))
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

function getFallbackRecommendation(
  request: LocalRecommendationRequest,
  reasoningTags: string[] = ["fallback_nearest_merchant"],
): LocalRecommendationResponse {
  const rankedMerchantIds = buildLocalRankingSignals(request).map(
    (signal) => signal.merchantId,
  );

  return {
    merchantId: rankedMerchantIds[0],
    confidence: 0.35,
    reasoningTags,
    rankedMerchantIds,
    modelSource: "fallback",
  };
}

function validateRecommendation(
  request: LocalRecommendationRequest,
  recommendation: LocalRecommendationResponse,
): LocalRecommendationResponse {
  if (!request.merchants.some((merchant) => merchant.id === recommendation.merchantId)) {
    throw new Error(`Local model recommended unknown merchant ${recommendation.merchantId}`);
  }

  return {
    ...recommendation,
    rankedMerchantIds: normalizeRankedMerchantIds(request, recommendation),
  };
}

function normalizeRankedMerchantIds(
  request: LocalRecommendationRequest,
  recommendation: LocalRecommendationResponse,
) {
  const knownMerchantIds = new Set(request.merchants.map((merchant) => merchant.id));
  const rankedMerchantIds = [
    recommendation.merchantId,
    ...(recommendation.rankedMerchantIds ?? []),
    ...buildLocalRankingSignals(request).map((signal) => signal.merchantId),
  ];

  return Array.from(
    new Set(rankedMerchantIds.filter((merchantId) => knownMerchantIds.has(merchantId))),
  );
}

function getFallbackReasoningTags(error: unknown) {
  if (!(error instanceof Error)) {
    return ["fallback_nearest_merchant", "model_error_fallback"];
  }

  if (error.message === "Local model timed out") {
    return ["fallback_nearest_merchant", "model_timeout_fallback"];
  }

  if (error.message.includes("unknown merchant")) {
    return ["fallback_nearest_merchant", "model_invalid_merchant_fallback"];
  }

  if (
    error.message.includes("invalid JSON") ||
    error.message.includes("invalid recommendation")
  ) {
    return ["fallback_nearest_merchant", "model_parse_error_fallback"];
  }

  return ["fallback_nearest_merchant", "model_error_fallback"];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Local model timed out"));
    }, timeoutMs);

    promise
      .then(resolve, reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

function distanceToUserMeters(
  merchant: MerchantSummary,
  request: LocalRecommendationRequest,
) {
  const user = request.context.coordinates;
  const merchantCoordinates = merchant.coordinates;
  const earthRadiusMeters = 6_371_000;
  const userLatitudeRadians = toRadians(user.latitude);
  const merchantLatitudeRadians = toRadians(merchantCoordinates.latitude);
  const latitudeDelta = toRadians(merchantCoordinates.latitude - user.latitude);
  const longitudeDelta = toRadians(merchantCoordinates.longitude - user.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(userLatitudeRadians) *
      Math.cos(merchantLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}
