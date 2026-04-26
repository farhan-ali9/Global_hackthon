/* Merchant-only static data used for map visuals and local fallback location. */
export type MapMerchant = {
  id: string;
  name: string;
  category: string;
  logoLetter: string;
  logoUrl?: string;
  brandColor: string;
  accentColor: string;
  offer: string;
  latitude: number;
  longitude: number;
};

export const MAP_MERCHANTS: MapMerchant[] = [
  {
    id: "cafe-traxlmayr",
    name: "Cafe Traxlmayr",
    category: "food",
    logoLetter: "T",
    brandColor: "#7B4A1E",
    accentColor: "#F4C87A",
    offer: "20% OFF",
    latitude: 48.3069,
    longitude: 14.2868,
  },
  {
    id: "donau-bistro",
    name: "Donau Bistro",
    category: "food",
    logoLetter: "D",
    brandColor: "#2F7D62",
    accentColor: "#BDE0C4",
    offer: "15% OFF",
    latitude: 48.3095,
    longitude: 14.2857,
  },
  {
    id: "buchhandlung-friedrich",
    name: "Buchhandlung Friedrich",
    category: "retail",
    logoLetter: "F",
    brandColor: "#4B3F72",
    accentColor: "#D8C7FF",
    offer: "10% OFF",
    latitude: 48.3054,
    longitude: 14.2875,
  },
  {
    id: "eis-greissler-linz",
    name: "Eis Greissler",
    category: "food",
    logoLetter: "E",
    brandColor: "#3B8EA5",
    accentColor: "#F7D6E0",
    offer: "25% OFF",
    latitude: 48.3047,
    longitude: 14.2892,
  },
  {
    id: "ars-electronica-shop",
    name: "Ars Electronica Shop",
    category: "entertainment",
    logoLetter: "A",
    brandColor: "#111827",
    accentColor: "#7DD3FC",
    offer: "12% OFF",
    latitude: 48.3099,
    longitude: 14.2842,
  },
  {
    id: "donau-radverleih",
    name: "Donau Radverleih",
    category: "transport",
    logoLetter: "R",
    brandColor: "#0D47A1",
    accentColor: "#42A5F5",
    offer: "20% OFF",
    latitude: 48.3131,
    longitude: 14.2848,
  },
  {
    id: "linzer-torte-haus",
    name: "Linzer Torte Haus",
    category: "food",
    logoLetter: "L",
    brandColor: "#8B1E3F",
    accentColor: "#FFD6A5",
    offer: "2 FOR 1",
    latitude: 48.3038,
    longitude: 14.2861,
  },
  {
    id: "stadtbad-linz",
    name: "Stadtbad Linz",
    category: "wellness",
    logoLetter: "S",
    brandColor: "#006D77",
    accentColor: "#83C5BE",
    offer: "FREE SAUNA",
    latitude: 48.3009,
    longitude: 14.2913,
  },
  {
    id: "lentos-cafe",
    name: "Lentos Cafe",
    category: "food",
    logoLetter: "L",
    brandColor: "#3D405B",
    accentColor: "#F2CC8F",
    offer: "18% OFF",
    latitude: 48.3088,
    longitude: 14.2879,
  },
  {
    id: "hauptplatz-apotheke",
    name: "Hauptplatz Apotheke",
    category: "wellness",
    logoLetter: "H",
    brandColor: "#2B7A78",
    accentColor: "#BEE3DB",
    offer: "8% OFF",
    latitude: 48.3062,
    longitude: 14.2851,
  },
  {
    id: "landstrasse-bakery",
    name: "Landstrasse Bakery",
    category: "food",
    logoLetter: "B",
    brandColor: "#9C6644",
    accentColor: "#EDE0D4",
    offer: "20% OFF",
    latitude: 48.3005,
    longitude: 14.2867,
  },
  {
    id: "suedbahnhof-market",
    name: "Suedbahnhof Market Stand",
    category: "retail",
    logoLetter: "M",
    brandColor: "#588157",
    accentColor: "#D8F3DC",
    offer: "15% OFF",
    latitude: 48.2922,
    longitude: 14.2928,
  },
  {
    id: "urfahr-books",
    name: "Urfahr Books",
    category: "retail",
    logoLetter: "U",
    brandColor: "#5E548E",
    accentColor: "#E0B1CB",
    offer: "10% OFF",
    latitude: 48.3146,
    longitude: 14.2871,
  },
];

/** User's fallback location — central Linz */
export const USER_LOCATION = { latitude: 48.3069, longitude: 14.2868 };
