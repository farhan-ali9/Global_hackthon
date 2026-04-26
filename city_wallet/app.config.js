/**
 * Dynamic Expo config — extends app.json with secrets from .env.
 * Expo SDK 49+ automatically loads .env before this file runs,
 * so process.env.GOOGLE_MAPS_API_KEY is already populated.
 *
 * Never put real API keys in app.json or commit .env to git.
 */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "llama.rn",
      {
        enableEntitlements: true,
        entitlementsProfile: "production",
        forceCxx20: true,
        enableOpenCLAndHexagon: true,
      },
    ],
  ],
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
});
