import { demoContextSnapshot } from "@/src/data/mockData";
import type { ContextSnapshot } from "@/src/types/city-wallet";

export type ContextProvider = {
  getCurrentSnapshot: () => Promise<ContextSnapshot>;
};

// Context team: replace this with location, weather, events, and demand signals.
export const mockContextProvider: ContextProvider = {
  async getCurrentSnapshot() {
    return demoContextSnapshot;
  },
};
