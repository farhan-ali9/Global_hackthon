import type {
  GeneratedCouponResponse,
  GeneratedOfferResponse,
  GenerateCouponRequest,
  MerchantCandidate,
  MerchantSummary,
  RedemptionResponse,
  SelectedOfferRequest,
} from "@/src/types/city-wallet";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";
const requestTimeoutMs = 10_000;

export async function getMerchantCandidates(
  cityId: string,
): Promise<{ candidates: MerchantCandidate[] }> {
  return request(`/merchants/candidates?cityId=${encodeURIComponent(cityId)}`);
}

export async function generateOffer(
  payload: SelectedOfferRequest,
): Promise<GeneratedOfferResponse> {
  return request("/offers/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMerchants(cityId: string): Promise<MerchantSummary[]> {
  const params = new URLSearchParams({ cityId });
  return request(`/merchants?${params.toString()}`);
}

export async function generateCoupon(
  requestBody: GenerateCouponRequest,
): Promise<GeneratedCouponResponse> {
  return request("/coupons/generate", {
    method: "POST",
    body: JSON.stringify(requestBody),
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
  const url = `${apiBaseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${requestTimeoutMs / 1000}s: ${url}`);
    }

    throw new Error(`Network request failed: ${url}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
