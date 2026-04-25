import type {
  GeneratedOfferResponse,
  RedemptionResponse,
} from "@/src/types/city-wallet";

let latestOffer: GeneratedOfferResponse | null = null;
let latestRedemption: RedemptionResponse | null = null;

export function setLatestOffer(offer: GeneratedOfferResponse) {
  latestOffer = offer;
}

export function getLatestOffer() {
  return latestOffer;
}

export function setLatestRedemption(redemption: RedemptionResponse) {
  latestRedemption = redemption;
}

export function getLatestRedemption() {
  return latestRedemption;
}
