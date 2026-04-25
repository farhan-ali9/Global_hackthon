import type { AnonymizedContextPayload } from "@/src/types/city-wallet";

export type ContextProvider = {
  getAnonymizedContext: () => Promise<AnonymizedContextPayload>;
};

// Context team: replace this with local-model anonymization of real context.
export const mockContextProvider: ContextProvider = {
  async getAnonymizedContext() {
    return {
      cityId: "stuttgart-demo",
      zoneId: "old-town",
      timeOfDay: "lunch",
      weatherBucket: "cold",
      intentLabels: ["browsing", "seeking_warmth"],
      eventTags: [],
      demandTags: ["quiet"],
    };
  },
};
