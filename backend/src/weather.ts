export type WeatherBucket = "clear" | "cloudy" | "rain" | "cold" | "hot";

export async function getWeatherByCoords(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "OpenWeather request failed");
  }

  const temperature = data.main.temp;
  const condition = data.weather[0].main.toLowerCase();

  let weatherBucket: WeatherBucket = "clear";

  if (temperature <= 12) weatherBucket = "cold";
  else if (temperature >= 28) weatherBucket = "hot";
  else if (condition.includes("rain")) weatherBucket = "rain";
  else if (condition.includes("cloud")) weatherBucket = "cloudy";

  return {
    temperature,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    weatherBucket,
  };
}