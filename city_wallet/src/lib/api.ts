import type {
  AnonymizedContextPayload,
  GeneratedCouponResponse,
  GeneratedOfferResponse,
  GenerateCouponRequest,
  MerchantSummary,
  RedemptionResponse,
} from "@/src/types/city-wallet";
import Constants from "expo-constants";
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
const DEFAULT_API_PORT = "4000";
const apiConfig = resolveApiConfig();
const apiBaseUrl = apiConfig.baseUrl;

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
  logApiRequest({ method, path, requestUrl });
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
    const errorBody = await readErrorBody(response);
    console.log("[api] request failed", {
      method,
      requestUrl,
      status: response.status,
      errorBody,
    });
    throw new Error(
      buildHttpFailureMessage({ method, requestUrl, response, errorBody }),
    );
  }

  return response.json() as Promise<T>;
}

function resolveApiConfig() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return {
      baseUrl: removeTrailingSlash(configuredBaseUrl),
      source: "env",
    };
  }

  const metroHost = getMetroHost();
  if (metroHost && !isLoopbackHost(metroHost)) {
    return {
      baseUrl: `http://${metroHost}:${DEFAULT_API_PORT}`,
      source: "metro_host",
    };
  }

  if (Platform.OS === "android") {
    return {
      baseUrl: `http://10.0.2.2:${DEFAULT_API_PORT}`,
      source: "android_emulator_default",
    };
  }

  return {
    baseUrl: `http://localhost:${DEFAULT_API_PORT}`,
    source: Platform.OS === "web" ? "web_default" : "ios_simulator_default",
  };
}

function removeTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function getMetroHost() {
  const hostUri = getExpoHostUri();
  if (!hostUri) return null;

  const candidate = hostUri.includes("://") ? hostUri : `http://${hostUri}`;
  try {
    return new URL(candidate).hostname || null;
  } catch {
    return hostUri.split(":")[0] || null;
  }
}

function getExpoHostUri() {
  const expoConfig = Constants.expoConfig as { hostUri?: string } | null;
  const manifest2 = Constants.manifest2 as
    | { extra?: { expoClient?: { hostUri?: string } } }
    | null
    | undefined;
  const manifest = Constants.manifest as
    | { debuggerHost?: string; hostUri?: string }
    | null
    | undefined;

  return (
    expoConfig?.hostUri ??
    manifest2?.extra?.expoClient?.hostUri ??
    manifest?.hostUri ??
    manifest?.debuggerHost ??
    null
  );
}

function isLoopbackHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function logApiRequest(args: {
  method: string;
  path: string;
  requestUrl: string;
}) {
  console.info("[api] request", {
    method: args.method,
    path: args.path,
    requestUrl: args.requestUrl,
    apiBaseUrl,
    apiBaseUrlSource: apiConfig.source,
    platform: Platform.OS,
    appOwnership: Constants.appOwnership ?? "unknown",
  });
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

async function readErrorBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildHttpFailureMessage(args: {
  method: string;
  requestUrl: string;
  response: Response;
  errorBody: unknown;
}) {
  const serverError =
    typeof args.errorBody === "object" &&
    args.errorBody !== null &&
    "error" in args.errorBody &&
    typeof args.errorBody.error === "string"
      ? args.errorBody.error
      : null;
  const requestId =
    typeof args.errorBody === "object" &&
    args.errorBody !== null &&
    "requestId" in args.errorBody &&
    typeof args.errorBody.requestId === "string"
      ? args.errorBody.requestId
      : null;
  const rawDetail =
    serverError === null && typeof args.errorBody === "string"
      ? args.errorBody
      : null;
  const detail = serverError ?? rawDetail;
  const requestIdDetail = requestId ? ` Request ID: ${requestId}.` : "";

  return `${args.method} ${args.requestUrl} failed with ${args.response.status}${
    detail ? `: ${detail}` : ""
  }.${requestIdDetail}`;
}
