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

export function setLocalMerchantModelClient(client: LocalMerchantModelClient) {
  localMerchantModelClient = client;
}

export async function recommendMerchant(
  request: LocalRecommendationRequest,
): Promise<LocalRecommendationResponse> {
  if (request.merchants.length === 0) {
    throw new Error("Cannot recommend a merchant from an empty merchant list");
  }

  const recommendation =
    localMerchantModelClient === null
      ? getFallbackRecommendation(request)
      : await localMerchantModelClient.recommendMerchant(request);

  if (!request.merchants.some((merchant) => merchant.id === recommendation.merchantId)) {
    throw new Error(`Local model recommended unknown merchant ${recommendation.merchantId}`);
  }

  return recommendation;
}

export function buildLocalModelPrompt(request: LocalRecommendationRequest) {
  return [
    "Pick the best merchant for this user context.",
    "Return JSON only: {\"merchantId\":\"...\",\"confidence\":0.0,\"reasoningTags\":[\"...\"]}.",
    "",
    "User context:",
    JSON.stringify(request.context, null, 2),
    "",
    "Merchants:",
    JSON.stringify(request.merchants, null, 2),
  ].join("\n");
}

function getFallbackRecommendation(
  request: LocalRecommendationRequest,
): LocalRecommendationResponse {
  const merchant = [...request.merchants].sort((left, right) => {
    return distanceToUser(left, request) - distanceToUser(right, request);
  })[0];

  return {
    merchantId: merchant.id,
    confidence: 0.35,
    reasoningTags: ["fallback_nearest_merchant"],
  };
}

function distanceToUser(
  merchant: MerchantSummary,
  request: LocalRecommendationRequest,
) {
  const user = request.context.coordinates;
  const merchantCoordinates = merchant.coordinates;
  const latitudeDelta = user.latitude - merchantCoordinates.latitude;
  const longitudeDelta = user.longitude - merchantCoordinates.longitude;

  return Math.sqrt(latitudeDelta ** 2 + longitudeDelta ** 2);
}
