import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const merchants = [
  {
    id: "merchant-cafe-mueller",
    name: "Cafe Mueller",
    category: "CAFE" as const,
    cityId: "linz-demo",
    zoneId: "hauptplatz",
    distanceMeters: 80,
    latitude: 48.3069,
    longitude: 14.2858,
    description:
      "Cafe Mueller — small specialty coffee bar near Linz Hauptplatz with a quiet upstairs reading room. Known for single-origin espresso and almond croissants.",
    rules: `# Cafe Mueller — coupon rules
- Maximum discount: 20%
- Only offer discounts during quiet hours (Mon–Fri 11:00–14:00, Sat–Sun never)
- Never discount espresso below a 10% reduction
- Tone: warm, concise, in second person
- Always mention the upstairs reading room when intent looks like "work" or "focus"
- Coupons must be valid for 15 minutes only`,
    rule: {
      id: "rule-cafe-mueller",
      goal: "Fill quiet lunch windows without discounting above the merchant cap.",
      maxDiscountPercent: 20,
      quietHours: "11:00-14:00",
    },
    demand: {
      state: "QUIET" as const,
      score: 28,
    },
  },
  {
    id: "merchant-bistro-market",
    name: "Market Bistro",
    category: "RESTAURANT" as const,
    cityId: "linz-demo",
    zoneId: "altstadt",
    distanceMeters: 220,
    latitude: 48.3059,
    longitude: 14.2841,
    description:
      "Market Bistro — seasonal lunch bistro near Linz Altstadt, sourcing produce from the morning market. 30-seat dining room, fast lunch service.",
    rules: `# Market Bistro — coupon rules
- Maximum discount: 15%
- Lunch menu only (11:30–14:30); no dinner discounts
- Never discount the chef's tasting plate
- Tone: fresh, energetic, food-forward
- Mention the daily market sourcing when relevant
- Discounts apply to single covers, not groups of 4+`,
    rule: {
      id: "rule-bistro-market",
      goal: "Drive nearby lunch visits when demand is normal or quiet.",
      maxDiscountPercent: 15,
      quietHours: "12:00-15:00",
    },
    demand: {
      state: "NORMAL" as const,
      score: 54,
    },
  },
  {
    id: "merchant-bookshop-kern",
    name: "Bookshop Kern",
    category: "RETAIL" as const,
    cityId: "linz-demo",
    zoneId: "hauptplatz",
    distanceMeters: 140,
    latitude: 48.3076,
    longitude: 14.2871,
    description:
      "Bookshop Kern — independent bookshop in the Linz old town focused on architecture, design, and translated fiction. Small cafe corner with filter coffee.",
    rules: `# Bookshop Kern — coupon rules
- Maximum discount: 10%
- Books only — no discounts on stationery or gift cards
- Tone: thoughtful, calm, no exclamation marks
- If user intent suggests browsing or rainy weather, emphasise the reading nook
- Never discount new releases from the current month`,
    rule: {
      id: "rule-bookshop-kern",
      goal: "Bring browsing pedestrians inside during slow afternoons.",
      maxDiscountPercent: 10,
      quietHours: "14:00-17:00",
    },
    demand: {
      state: "BUSY" as const,
      score: 82,
    },
  },
  {
    id: "merchant-gelato-bella",
    name: "Gelato Bella",
    category: "RESTAURANT" as const,
    cityId: "linz-demo",
    zoneId: "landstrasse",
    distanceMeters: 320,
    latitude: 48.3029,
    longitude: 14.2912,
    description:
      "Gelato Bella — artisanal gelateria near Linz Landstraße. Rotating seasonal flavours, vegan sorbets always available.",
    rules: `# Gelato Bella — coupon rules
- Maximum discount: 25%
- Only offer the higher discounts (>15%) when weather is hot or sunny
- Always include at least one vegan flavour suggestion
- Tone: playful, short sentences, no marketing jargon
- Never combine with the existing loyalty card`,
    rule: {
      id: "rule-gelato-bella",
      goal: "Promote seasonal flavours when weather is warm.",
      maxDiscountPercent: 25,
      quietHours: "14:00-17:00",
    },
    demand: {
      state: "NORMAL" as const,
      score: 46,
    },
  },
  {
    id: "merchant-museum-shop-staatsgalerie",
    name: "Staatsgalerie Museum Shop",
    category: "CULTURE" as const,
    cityId: "linz-demo",
    zoneId: "museum-quarter",
    distanceMeters: 520,
    latitude: 48.3097,
    longitude: 14.2843,
    description:
      "Museum Shop Lentos — design-led museum shop near the Danube, carrying art books, prints, and gift-quality stationery.",
    rules: `# Staatsgalerie Shop — coupon rules
- Maximum discount: 12%
- Only valid alongside a same-day museum ticket
- Tone: curated, quietly confident, never salesy
- Highlight current exhibition tie-in items when context suggests culture or art interest
- Never discount limited-edition prints`,
    rule: {
      id: "rule-museum-shop-staatsgalerie",
      goal: "Convert museum visitors into shop customers after exhibitions.",
      maxDiscountPercent: 12,
      quietHours: "15:00-18:00",
    },
    demand: {
      state: "QUIET" as const,
      score: 36,
    },
  },
  {
    id: "merchant-bike-rental-neckar",
    name: "Neckar Bike Rental",
    category: "RETAIL" as const,
    cityId: "linz-demo",
    zoneId: "danube-river",
    distanceMeters: 1800,
    latitude: 48.3162,
    longitude: 14.2911,
    description:
      "Danube Bike Rental — riverside bike rental shop near the Linz Danube promenade. City bikes, e-bikes, and child seats available by the hour or day.",
    rules: `# Neckar Bike Rental — coupon rules
- Maximum discount: 20%
- Only offer discounts when weather is clear or warm; never during rain
- Tone: outdoorsy, practical, mention the riverside route
- Discount applies to the first 2 hours of rental only
- Never discount e-bike full-day rentals`,
    rule: {
      id: "rule-bike-rental-neckar",
      goal: "Increase short rentals during clear low-demand windows.",
      maxDiscountPercent: 20,
      quietHours: "10:00-13:00",
    },
    demand: {
      state: "NORMAL" as const,
      score: 58,
    },
  },
];

async function main() {
  for (const merchant of merchants) {
    await prisma.merchant.upsert({
      where: { id: merchant.id },
      create: {
        id: merchant.id,
        name: merchant.name,
        description: merchant.description,
        category: merchant.category,
        cityId: merchant.cityId,
        zoneId: merchant.zoneId,
        distanceMeters: merchant.distanceMeters,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        rules: merchant.rules,
        rule: {
          create: merchant.rule,
        },
        demandSignals: {
          create: merchant.demand,
        },
      },
      update: {
        name: merchant.name,
        description: merchant.description,
        category: merchant.category,
        cityId: merchant.cityId,
        zoneId: merchant.zoneId,
        distanceMeters: merchant.distanceMeters,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        rules: merchant.rules,
        active: true,
        rule: {
          upsert: {
            create: merchant.rule,
            update: merchant.rule,
          },
        },
        demandSignals: {
          create: merchant.demand,
        },
      },
    });
  }
  console.log(`Seeded ${merchants.length} merchants.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
