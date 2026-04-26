import Constants from "expo-constants";

const localModelEnabled =
  process.env.EXPO_PUBLIC_ENABLE_LOCAL_MODEL?.toLowerCase() === "true";

if (Constants.appOwnership === "expo") {
  console.info(
    "Running in Expo Go: using fallback merchant recommender; native GGUF is unavailable.",
  );
} else if (__DEV__ && !localModelEnabled) {
  console.info(
    "Local merchant model disabled in dev build. Set EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true to enable.",
  );
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerReactNativeAiMerchantModelClient } = require("./ReactNativeAiMerchantModelClient");
    registerReactNativeAiMerchantModelClient();
  } catch (error) {
    console.warn(
      "Native GGUF merchant model could not be registered; using fallback recommender.",
      error,
    );
  }
}
