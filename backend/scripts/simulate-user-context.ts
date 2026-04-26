type MerchantSummary = {
  id: string;
  cityId: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

type SimulationOptions = {
  apiBaseUrl: string;
  cityId: string;
  durationMinutes: number;
  stepSeconds: number;
  realtime: boolean;
};

const DEFAULTS: SimulationOptions = {
  apiBaseUrl: process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000",
  cityId: "linz-demo",
  durationMinutes: 10,
  stepSeconds: 20,
  realtime: false,
};

const LINZ_PATH = [
  { latitude: 48.3069, longitude: 14.2868 }, // Hauptplatz
  { latitude: 48.3098, longitude: 14.2843 }, // Ars Electronica area
  { latitude: 48.3138, longitude: 14.2867 }, // Urfahr north
  { latitude: 48.3086, longitude: 14.2883 }, // Lentos side
  { latitude: 48.3034, longitude: 14.2894 }, // Landstrasse center
  { latitude: 48.2997, longitude: 14.2918 }, // south inner city
  { latitude: 48.2941, longitude: 14.2926 }, // Suedbahnhof market side
  { latitude: 48.3004, longitude: 14.2861 }, // back toward Landstrasse
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const totalSteps = Math.ceil((options.durationMinutes * 60) / options.stepSeconds);
  const merchants = await fetchMerchants(options);

  if (merchants.length === 0) {
    throw new Error(`No merchants returned for cityId=${options.cityId}`);
  }

  console.log(`Simulating user context for ${options.durationMinutes} minutes.`);
  console.log(`Steps: ${totalSteps} (${options.stepSeconds}s each), realtime=${options.realtime}`);
  console.log(`Merchants loaded: ${merchants.length}`);

  const startedAt = new Date();
  const picks = new Map<string, number>();

  for (let step = 0; step < totalSteps; step += 1) {
    const virtualTime = new Date(startedAt.getTime() + step * options.stepSeconds * 1000);
    const coordinates = interpolatePathPosition(step / Math.max(totalSteps - 1, 1));
    const weatherBucket = getWeatherBucket(step);
    const timeOfDay = getTimeOfDay(virtualTime);
    const intentLabels = getIntentLabels(timeOfDay, weatherBucket);

    const recommendation = recommendNearestMerchant(coordinates, merchants);
    picks.set(recommendation.id, (picks.get(recommendation.id) ?? 0) + 1);

    console.log(
      [
        `[${String(step + 1).padStart(2, "0")}/${totalSteps}]`,
        virtualTime.toISOString(),
        `loc=${coordinates.latitude.toFixed(4)},${coordinates.longitude.toFixed(4)}`,
        `weather=${weatherBucket}`,
        `timeOfDay=${timeOfDay}`,
        `merchant=${recommendation.id}`,
        `intent=${intentLabels.join("|")}`,
      ].join(" "),
    );

    if (options.realtime && step < totalSteps - 1) {
      await sleep(options.stepSeconds * 1000);
    }
  }

  console.log("\nSelection histogram:");
  for (const [merchantId, count] of [...picks.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${merchantId}: ${count} hits`);
  }
  console.log("\nDone. This validates the context -> merchants -> recommendation pipeline.");
}

function parseArgs(argv: string[]): SimulationOptions {
  const options = { ...DEFAULTS };

  for (const arg of argv) {
    if (arg === "--realtime") {
      options.realtime = true;
      continue;
    }
    if (arg.startsWith("--apiBaseUrl=")) {
      options.apiBaseUrl = arg.split("=")[1]?.replace(/\/$/, "") ?? options.apiBaseUrl;
      continue;
    }
    if (arg.startsWith("--cityId=")) {
      options.cityId = arg.split("=")[1] ?? options.cityId;
      continue;
    }
    if (arg.startsWith("--durationMinutes=")) {
      options.durationMinutes = Number(arg.split("=")[1] ?? options.durationMinutes);
      continue;
    }
    if (arg.startsWith("--stepSeconds=")) {
      options.stepSeconds = Number(arg.split("=")[1] ?? options.stepSeconds);
    }
  }

  if (!Number.isFinite(options.durationMinutes) || options.durationMinutes <= 0) {
    throw new Error("durationMinutes must be > 0");
  }
  if (!Number.isFinite(options.stepSeconds) || options.stepSeconds <= 0) {
    throw new Error("stepSeconds must be > 0");
  }

  return options;
}

async function fetchMerchants(options: SimulationOptions) {
  const params = new URLSearchParams({ cityId: options.cityId });
  const response = await fetch(`${options.apiBaseUrl}/merchants?${params.toString()}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GET /merchants failed (${response.status}): ${detail}`);
  }
  return (await response.json()) as MerchantSummary[];
}

function interpolatePathPosition(progress: number) {
  const segments = LINZ_PATH.length - 1;
  const scaled = Math.max(0, Math.min(1, progress)) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const segmentProgress = scaled - index;
  const from = LINZ_PATH[index];
  const to = LINZ_PATH[index + 1];

  return {
    latitude: from.latitude + (to.latitude - from.latitude) * segmentProgress,
    longitude: from.longitude + (to.longitude - from.longitude) * segmentProgress,
  };
}

function recommendNearestMerchant(
  coordinates: { latitude: number; longitude: number },
  merchants: MerchantSummary[],
) {
  return [...merchants].sort(
    (a, b) =>
      haversineMeters(coordinates, a.coordinates) -
      haversineMeters(coordinates, b.coordinates),
  )[0];
}

function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getTimeOfDay(date: Date) {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 15) return "lunch";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getWeatherBucket(step: number) {
  const buckets = ["cloudy", "clear", "cold", "rain"] as const;
  return buckets[step % buckets.length];
}

function getIntentLabels(timeOfDay: string, weatherBucket: string) {
  const labels = new Set<string>(["browsing"]);
  if (timeOfDay === "lunch") labels.add("hungry");
  if (weatherBucket === "cold" || weatherBucket === "rain") labels.add("seeking_warmth");
  if (timeOfDay === "morning" || timeOfDay === "evening") labels.add("commuting");
  return [...labels];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
