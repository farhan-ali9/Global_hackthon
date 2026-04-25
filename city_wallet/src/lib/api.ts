import type {
  AnonymizedContextPayload,
  GeneratedOfferResponse,
  RedemptionResponse,
} from "@/src/types/city-wallet";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export async function generateOffer(
  context: AnonymizedContextPayload,
): Promise<GeneratedOfferResponse> {
  return request("/offers/generate", {
    method: "POST",
    body: JSON.stringify(context),
  });
}

export async function acceptOffer(
  offerId: string,
): Promise<RedemptionResponse> {
  return request(`/offers/${offerId}/accept`, {
    method: "POST",
  });
}

export async function getRedemption(
  token: string,
): Promise<RedemptionResponse> {
  return request(`/redemptions/${token}`);
}

export async function validateRedemption(
  token: string,
): Promise<RedemptionResponse> {
  return request(`/redemptions/${token}/validate`, {
    method: "POST",
  });
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
