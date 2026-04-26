import * as Location from "expo-location";
import { getWeatherFromGps } from "@/src/lib/api";
import type {
  Coordinates,
  IntentLabel,
  TimeOfDay,
  UserContext,
  WeatherBucket,
  WeatherSituation,
} from "@/src/types/city-wallet";

export type ContextProvider = {
  getUserContext: () => Promise<UserContext>;
};

let cachedWeather: WeatherSituation | null = null;
const DEFAULT_COORDINATES = {
  latitude: 48.3069,
  longitude: 14.2868,
};

const DEFAULT_CITY_ID = "linz-demo";
const DEFAULT_ZONE_ID = "inner-city";

type CityArea = {
  cityId: string;
  zoneId: string;
  bounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  };
};

const SUPPORTED_CITY_AREAS: CityArea[] = [
  {
    cityId: "linz-demo",
    zoneId: "inner-city",
    bounds: {
      minLatitude: 48.27,
      maxLatitude: 48.34,
      minLongitude: 14.24,
      maxLongitude: 14.33,
    },
  },
];

export const deviceContextProvider: ContextProvider = {
  async getUserContext() {
    const now = new Date();
    const location = await getCurrentLocation();
    const coordinates = location?.coords ?? DEFAULT_COORDINATES;
    const cityArea = resolveCityArea(coordinates);
  
    let weather: WeatherSituation;

    if (cachedWeather) {
      weather = cachedWeather;
    } else {
      const weatherResponse = await getWeatherFromGps(
        coordinates.latitude,
        coordinates.longitude,
      );

      weather = {
        bucket: weatherResponse.weather.weatherBucket,
        label: weatherResponse.weather.description,
        temperatureCelsius: weatherResponse.weather.temperature,
        precipitationProbability: weatherResponse.weather.condition
          .toLowerCase()
          .includes("rain")
          ? 0.8
          : 0.1,
        source: "weather_api",
      };

      cachedWeather = weather;
    }
  console.log("GPS:", coordinates);
console.log("WEATHER:", weather);
    const timeOfDay = getTimeOfDay(now);
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    return {
      cityId: cityArea.cityId,
      zoneId: cityArea.zoneId,
      coordinates,
      coordinateAccuracyMeters: location?.coords.accuracy ?? undefined,
      currentTimeIso: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      locale: Intl.DateTimeFormat().resolvedOptions().locale ?? "en-US",
      dayOfWeek,
      isWeekend: dayOfWeek === "Saturday" || dayOfWeek === "Sunday",
      timeOfDay,
      weatherBucket: weather.bucket,
      weather,
      intentLabels: getIntentLabels(timeOfDay, weather.bucket),
      eventTags: [],
      demandTags: getDemandTags(timeOfDay),
      mobilityState: "unknown",
      privacyLevel: "device_precise",
    };
  },
};

export const mockContextProvider = deviceContextProvider;

async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    return null;
  }
}

function resolveCityArea(coordinates: Coordinates) {
  return (
    SUPPORTED_CITY_AREAS.find((cityArea) => isWithinBounds(coordinates, cityArea)) ??
    {
      cityId: DEFAULT_CITY_ID,
      zoneId: DEFAULT_ZONE_ID,
    }
  );
}

function isWithinBounds(coordinates: Coordinates, cityArea: CityArea) {
  const { bounds } = cityArea;

  return (
    coordinates.latitude >= bounds.minLatitude &&
    coordinates.latitude <= bounds.maxLatitude &&
    coordinates.longitude >= bounds.minLongitude &&
    coordinates.longitude <= bounds.maxLongitude
  );
}

function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 15) return "lunch";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getPlaceholderWeather(date: Date): WeatherSituation {
  const month = date.getMonth();
  const hour = date.getHours();

  if (month <= 1 || month === 11) {
    return {
      bucket: "cold",
      label: "Cold city weather",
      temperatureCelsius: 4,
      precipitationProbability: 0.25,
      source: "placeholder",
    };
  }

  if (month >= 5 && month <= 7 && hour >= 11 && hour <= 17) {
    return {
      bucket: "hot",
      label: "Warm and bright",
      temperatureCelsius: 27,
      precipitationProbability: 0.1,
      source: "placeholder",
    };
  }

  return {
    bucket: "cloudy",
    label: "Mild and cloudy",
    temperatureCelsius: 14,
    precipitationProbability: 0.2,
    source: "placeholder",
  };
}

function getIntentLabels(
  timeOfDay: TimeOfDay,
  weatherBucket: WeatherBucket,
): IntentLabel[] {
  const labels = new Set<IntentLabel>(["browsing"]);

  if (timeOfDay === "lunch") labels.add("hungry");
  if (weatherBucket === "cold" || weatherBucket === "rain") {
    labels.add("seeking_warmth");
  }
  if (timeOfDay === "morning" || timeOfDay === "evening") {
    labels.add("commuting");
  }

  return Array.from(labels);
}

function getDemandTags(timeOfDay: TimeOfDay) {
  if (timeOfDay === "lunch") return ["lunch_window"];
  if (timeOfDay === "evening") return ["after_work"];
  return ["quiet"];
}
