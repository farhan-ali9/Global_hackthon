import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const merchants = [
  {
    id: "merchant-cafe-mueller",
    cityId: "stuttgart-demo",
    latitude: 48.7784,
    longitude: 9.1801,
    description:
      "Cafe Mueller — small specialty coffee bar on Schlossplatz with a quiet upstairs reading room. Known for single-origin espresso and almond croissants.",
    rules: `# Cafe Mueller — coupon rules
- Maximum discount: 20%
- Only offer discounts during quiet hours (Mon–Fri 11:00–14:00, Sat–Sun never)
- Never discount espresso below a 10% reduction
- Tone: warm, concise, in second person
- Always mention the upstairs reading room when intent looks like "work" or "focus"
- Coupons must be valid for 15 minutes only`,
  },
  {
    id: "merchant-bistro-market",
    cityId: "stuttgart-demo",
    latitude: 48.7758,
    longitude: 9.1779,
    description:
      "Market Bistro — seasonal lunch bistro next to Markthalle, sourcing produce from the indoor market each morning. 30-seat dining room, fast lunch service.",
    rules: `# Market Bistro — coupon rules
- Maximum discount: 15%
- Lunch menu only (11:30–14:30); no dinner discounts
- Never discount the chef's tasting plate
- Tone: fresh, energetic, food-forward
- Mention the daily market sourcing when relevant
- Discounts apply to single covers, not groups of 4+`,
  },
  {
    id: "merchant-bookshop-kern",
    cityId: "stuttgart-demo",
    latitude: 48.7769,
    longitude: 9.1812,
    description:
      "Bookshop Kern — independent bookshop in the Old Town focused on architecture, design, and translated fiction. Small cafe corner with filter coffee.",
    rules: `# Bookshop Kern — coupon rules
- Maximum discount: 10%
- Books only — no discounts on stationery or gift cards
- Tone: thoughtful, calm, no exclamation marks
- If user intent suggests browsing or rainy weather, emphasise the reading nook
- Never discount new releases from the current month`,
  },
  {
    id: "merchant-gelato-bella",
    cityId: "stuttgart-demo",
    latitude: 48.7741,
    longitude: 9.1822,
    description:
      "Gelato Bella — artisanal gelateria on Königstraße. Rotating seasonal flavours, vegan sorbets always available.",
    rules: `# Gelato Bella — coupon rules
- Maximum discount: 25%
- Only offer the higher discounts (>15%) when weather is hot or sunny
- Always include at least one vegan flavour suggestion
- Tone: playful, short sentences, no marketing jargon
- Never combine with the existing loyalty card`,
  },
  {
    id: "merchant-museum-shop-staatsgalerie",
    cityId: "stuttgart-demo",
    latitude: 48.7806,
    longitude: 9.1873,
    description:
      "Staatsgalerie Museum Shop — design-led museum shop attached to the Staatsgalerie, carrying art books, prints, and gift-quality stationery.",
    rules: `# Staatsgalerie Shop — coupon rules
- Maximum discount: 12%
- Only valid alongside a same-day museum ticket
- Tone: curated, quietly confident, never salesy
- Highlight current exhibition tie-in items when context suggests culture or art interest
- Never discount limited-edition prints`,
  },
  {
    id: "merchant-bike-rental-neckar",
    cityId: "stuttgart-demo",
    latitude: 48.7892,
    longitude: 9.2103,
    description:
      "Neckar Bike Rental — riverside bike rental shop near the Neckar promenade. City bikes, e-bikes, and child seats available by the hour or day.",
    rules: `# Neckar Bike Rental — coupon rules
- Maximum discount: 20%
- Only offer discounts when weather is clear or warm; never during rain
- Tone: outdoorsy, practical, mention the riverside route
- Discount applies to the first 2 hours of rental only
- Never discount e-bike full-day rentals`,
  },
];

async function main() {
  for (const merchant of merchants) {
    await prisma.merchant.upsert({
      where: { id: merchant.id },
      create: merchant,
      update: merchant,
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
