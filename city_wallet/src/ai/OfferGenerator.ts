import { demoOffer } from "@/src/data/mockData";
import type {
  ContextSnapshot,
  GeneratedOffer,
  Merchant,
  MerchantRule,
} from "@/src/types/city-wallet";

export type OfferGenerator = {
  generateOffer: (input: {
    context: ContextSnapshot;
    merchant: Merchant;
    rule: MerchantRule;
  }) => Promise<GeneratedOffer>;
};

// AI team: replace this adapter with React Native AI in a dev build when ready.
export const mockOfferGenerator: OfferGenerator = {
  async generateOffer() {
    return demoOffer;
  },
};
