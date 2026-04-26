import type {
  LocalRecommendationRequest,
  LocalRecommendationResponse,
  MerchantSummary,
} from "@/src/types/city-wallet";

export type LocalMerchantModelClient = {
  recommendMerchant: (
    request: LocalRecommendationRequest,
    options?: { signal?: AbortSignal },
  ) => Promise<LocalRecommendationResponse>;
};

let localMerchantModelClient: LocalMerchantModelClient | null = null;
const LOCAL_MODEL_OPERATION_TIMEOUT_MS = 180_000;
const MAX_MERCHANTS_IN_PROMPT = 10;
const MAX_DESCRIPTION_CHARS = 140;
const MAX_PROMPT_CHARS = 6_000;

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
  const modelClient = localMerchantModelClient;

  try {
    const recommendation = await withTimeout(
      (signal) => modelClient.recommendMerchant(request, { signal }),
      LOCAL_MODEL_OPERATION_TIMEOUT_MS,
    );

    return validateRecommendation(request, recommendation);
  } catch (error) {
    console.warn("Local merchant model failed; using fallback.", error);

    return getFallbackRecommendation(request, getFallbackReasoningTags(error));
  }
}

export function buildLocalModelPrompt(request: LocalRecommendationRequest) {
  const rankingSignals = buildLocalRankingSignals(request);
  const compactContext = buildCompactContext(request);
  const compactSignals = rankingSignals.slice(0, MAX_MERCHANTS_IN_PROMPT);
  const compactMerchants = buildCompactMerchants(request, compactSignals);
  const prompt = [
    "Rank the best local merchant for this private on-device user context.",
    "Use the user context, merchant summaries, and computed local ranking signals.",
    "Return JSON only with this shape:",
    "{\"merchantId\":\"...\",\"confidence\":0.0,\"reasoningTags\":[\"...\"],\"rankedMerchantIds\":[\"...\"]}",
    "merchantId must be one of the provided merchant ids. Do not include markdown or explanation text.",
    "",
    "User context:",
    JSON.stringify(compactContext),
    "",
    "Local ranking signals:",
    JSON.stringify(compactSignals),
    "",
    "Merchants:",
    JSON.stringify(compactMerchants),
  ].join("\n");

  if (prompt.length <= MAX_PROMPT_CHARS) {
    return prompt;
  }

  return `${prompt.slice(0, MAX_PROMPT_CHARS)}\n\n[Prompt truncated to fit local model context window]`;
}

export function buildLocalIntentPrompt(
  request: LocalRecommendationRequest,
  recommendation: Pick<LocalRecommendationResponse, "merchantId" | "reasoningTags">,
) {
  const compactContext = buildCompactContext(request);
  const recommendedMerchant = request.merchants.find(
    (merchant) => merchant.id === recommendation.merchantId,
  );
  const prompt = [
    "Infer the user's immediate shopping intent from this private on-device context.",
    "The merchant was selected in a separate step and is included as a hint only.",
    'Return JSON only with this shape: {"userIntent":"..."}',
    "userIntent must be a short snake_case phrase (2-6 words). No markdown or extra text.",
    "",
    "User context:",
    JSON.stringify(compactContext),
    "",
    "Recommended merchant:",
    JSON.stringify({
      merchantId: recommendation.merchantId,
      description: recommendedMerchant?.description.slice(0, MAX_DESCRIPTION_CHARS) ?? "",
      reasoningTags: recommendation.reasoningTags ?? [],
    }),
  ].join("\n");

  if (prompt.length <= MAX_PROMPT_CHARS) {
    return prompt;
  }

  return `${prompt.slice(0, MAX_PROMPT_CHARS)}\n\n[Prompt truncated to fit local model context window]`;
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
    userIntent: buildFallbackUserIntent(request),
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
    userIntent: sanitizeModelUserIntent(recommendation.userIntent, request),
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

function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Local model timed out"));
    }, timeoutMs);

    operation(controller.signal)
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

function buildCompactContext(request: LocalRecommendationRequest) {
  const { context } = request;
  return {
    cityId: context.cityId,
    zoneId: context.zoneId,
    timeOfDay: context.timeOfDay,
    dayOfWeek: context.dayOfWeek,
    isWeekend: context.isWeekend,
    weatherBucket: context.weatherBucket,
    intentLabels: context.intentLabels.slice(0, 6),
    demandTags: context.demandTags.slice(0, 6),
    mobilityState: context.mobilityState,
    coordinates: {
      latitude: roundTo(context.coordinates.latitude, 4),
      longitude: roundTo(context.coordinates.longitude, 4),
    },
  };
}

function buildCompactMerchants(
  request: LocalRecommendationRequest,
  compactSignals: LocalRankingSignal[],
) {
  const compactSignalMap = new Map(
    compactSignals.map((signal) => [signal.merchantId, signal.distanceMeters]),
  );
  return request.merchants
    .filter((merchant) => compactSignalMap.has(merchant.id))
    .map((merchant) => ({
      id: merchant.id,
      cityId: merchant.cityId,
      distanceMeters: compactSignalMap.get(merchant.id),
      description: merchant.description.slice(0, MAX_DESCRIPTION_CHARS),
    }));
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sanitizeModelUserIntent(intent: string | undefined, request: LocalRecommendationRequest) {
  const trimmed = intent?.trim().toLowerCase();
  if (trimmed) {
    return trimmed;
  }
  return buildFallbackUserIntent(request);
}

function buildFallbackUserIntent(request: LocalRecommendationRequest) {
  const firstIntent = request.context.intentLabels[0] ?? "browsing";
  const firstDemand = request.context.demandTags[0] ?? "local_discovery";
  return `${firstIntent}_${firstDemand}`.replaceAll("-", "_");
}
