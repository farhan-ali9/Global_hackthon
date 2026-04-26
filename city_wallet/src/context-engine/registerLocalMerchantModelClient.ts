try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerReactNativeAiMerchantModelClient } = require("./ReactNativeAiMerchantModelClient");
  registerReactNativeAiMerchantModelClient();
} catch {
  // Native GGUF module unavailable in Expo Go — on-device inference disabled.
}
