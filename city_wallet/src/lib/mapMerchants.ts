import type { MerchantSummary } from "@/src/types/city-wallet";

import { MAP_MERCHANTS, type MapMerchant } from "@/src/data/mockData";

const BRAND_COLORS = [
  "#7B4A1E",
  "#2F7D62",
  "#4B3F72",
  "#3B8EA5",
  "#111827",
  "#0D47A1",
  "#8B1E3F",
  "#006D77",
  "#588157",
  "#5E548E",
];

export function getDisplayMapMerchants(merchants: MerchantSummary[]): MapMerchant[] {
  if (merchants.length === 0) {
    return MAP_MERCHANTS;
  }

  return merchants.map((merchant) => {
    const name = merchant.name ?? getMerchantName(merchant.description);
    const brandColor = getBrandColor(merchant.id);
    return {
      id: merchant.id,
      name,
      category: merchant.category?.toLowerCase() ?? "merchant",
      logoLetter: getLogoLetter(name),
      brandColor,
      accentColor: `${brandColor}33`,
      offer: "Nearby",
      latitude: merchant.coordinates.latitude,
      longitude: merchant.coordinates.longitude,
    };
  });
}

function getMerchantName(description: string) {
  return description.split(" — ")[0] ?? description;
}

function getLogoLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}

function getBrandColor(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return BRAND_COLORS[hash % BRAND_COLORS.length];
}
