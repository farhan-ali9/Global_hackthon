export type ContextProvider = {
  getLocalSignals: () => Promise<LocalSignalSnapshot>;
};

export type LocalSignalSnapshot = {
  cityId: string;
  localSignalSummary: string;
  zoneId?: string;
  capturedAt?: string;
};

export const createUnavailableContextProvider = (): ContextProvider => ({
  async getLocalSignals() {
    throw new Error("Local signal capture is not wired yet");
  },
});
