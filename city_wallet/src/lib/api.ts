import type {
  AnonymizedContextPayload,
  GeneratedCouponResponse,
  GeneratedOfferResponse,
  GenerateCouponRequest,
  MerchantSummary,
  RedemptionResponse,
} from "@/src/types/city-wallet";
import { Platform } from "react-native";
export type WeatherBucket = "clear" | "cloudy" | "rain" | "cold" | "hot";

export type WeatherContextResponse = {
  location: {
    lat: number;
    lon: number;
  };
  weather: {
    temperature: number;
    condition: string;
    description: string;
    weatherBucket: WeatherBucket;
  };
};

export async function getWeatherFromGps(
  lat: number,
  lon: number,
): Promise<WeatherContextResponse> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_OPENWEATHER_API_KEY");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Weather request failed");
  }

  const temperature = data.main.temp;
  const condition = data.weather[0].main.toLowerCase();

  let weatherBucket: WeatherBucket = "clear";

  if (temperature <= 12) weatherBucket = "cold";
  else if (temperature >= 28) weatherBucket = "hot";
  else if (condition.includes("rain")) weatherBucket = "rain";
  else if (condition.includes("cloud")) weatherBucket = "cloudy";

  return {
    location: { lat, lon },
    weather: {
      temperature,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      weatherBucket,
    },
  };
}
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
  const method = options.method ?? "GET";
  const requestUrl = `${apiBaseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      buildNetworkFailureMessage({
        method,
        requestUrl,
        originalError: error,
      }),
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Request failed (${response.status}) for ${method} ${requestUrl}${
        message ? `: ${message}` : ""
      }`,
    );
  }

  return response.json() as Promise<T>;
}

function buildNetworkFailureMessage(args: {
  method: string;
  requestUrl: string;
  originalError: unknown;
}) {
  const localhostHint =
    Platform.OS !== "web" &&
    (apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1"))
      ? " If running on a physical device, set EXPO_PUBLIC_API_BASE_URL to your computer LAN IP (for example http://192.168.x.x:4000), not localhost."
      : "";
  const detail =
    args.originalError instanceof Error && args.originalError.message
      ? ` Original error: ${args.originalError.message}`
      : "";

  return `Network request failed for ${args.method} ${args.requestUrl}.${localhostHint}${detail}`;
}
