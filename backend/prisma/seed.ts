import "dotenv/config";

import { createHash } from "node:crypto";

import { PrismaClient, type MerchantCategory } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_OWNER_EMAIL = "demo-merchant@citywallet.local";
const DEMO_OWNER_PASSWORD = "demo-password";

const merchants = [
  {
    id: "merchant-cafe-traxlmayr",
    cityId: "linz-demo",
    latitude: 48.3069,
    longitude: 14.2868,
    description:
      "Cafe Traxlmayr — classic Linz coffee house near the Landstrasse with marble tables, newspapers, cakes, and a covered courtyard.",
    rules: `# Cafe Traxlmayr — coupon rules
- Maximum discount: 20%
- Only offer discounts during quiet hours (Mon–Fri 10:30–14:00, Sat–Sun never)
- Never discount the house blend below a 10% reduction
- Tone: warm, concise, in second person
- Mention the covered courtyard when weather suggests rain or cold
- Coupons must be valid for 15 minutes only`,
  },
  {
    id: "merchant-donau-bistro",
    cityId: "linz-demo",
    latitude: 48.3095,
    longitude: 14.2857,
    description:
      "Donau Bistro — seasonal lunch spot beside the Danube promenade with soups, salads, and fast weekday service for office workers.",
    rules: `# Donau Bistro — coupon rules
- Maximum discount: 15%
- Lunch menu only (11:30–14:30); no dinner discounts
- Never discount the weekend brunch board
- Tone: fresh, energetic, food-forward
- Mention the riverside lunch break when relevant
- Discounts apply to single covers, not groups of 4+`,
  },
  {
    id: "merchant-buchhandlung-friedrich",
    cityId: "linz-demo",
    latitude: 48.3054,
    longitude: 14.2875,
    description:
      "Buchhandlung Friedrich — independent bookshop near Hauptplatz with Austrian fiction, design books, postcards, and a small reading bench.",
    rules: `# Buchhandlung Friedrich — coupon rules
- Maximum discount: 10%
- Books only — no discounts on stationery or gift cards
- Tone: thoughtful, calm, no exclamation marks
- If user intent suggests browsing or rainy weather, emphasise the reading bench
- Never discount new releases from the current month`,
  },
  {
    id: "merchant-eis-greissler-linz",
    cityId: "linz-demo",
    latitude: 48.3047,
    longitude: 14.2892,
    description:
      "Eis Greissler Linz — artisanal ice cream shop on the inner-city shopping route with seasonal flavours and vegan sorbets.",
    rules: `# Eis Greissler Linz — coupon rules
- Maximum discount: 25%
- Only offer the higher discounts (>15%) when weather is hot or sunny
- Always include at least one vegan flavour suggestion
- Tone: playful, short sentences, no marketing jargon
- Never combine with the existing loyalty card`,
  },
  {
    id: "merchant-ars-electronica-shop",
    cityId: "linz-demo",
    latitude: 48.3099,
    longitude: 14.2842,
    description:
      "Ars Electronica Shop — museum shop near the Ars Electronica Center with design objects, science kits, books, and digital culture gifts.",
    rules: `# Ars Electronica Shop — coupon rules
- Maximum discount: 12%
- Only valid alongside a same-day museum or exhibition visit
- Tone: curious, smart, never salesy
- Highlight technology and art tie-in items when context suggests culture or learning
- Never discount limited-edition prints`,
  },
  {
    id: "merchant-donau-radverleih",
    cityId: "linz-demo",
    latitude: 48.3131,
    longitude: 14.2848,
    description:
      "Donau Radverleih — bike rental near the Danube cycle path with city bikes, e-bikes, helmets, and short route advice.",
    rules: `# Donau Radverleih — coupon rules
- Maximum discount: 20%
- Only offer discounts when weather is clear or warm; never during rain
- Tone: outdoorsy, practical, mention the Danube cycle path
- Discount applies to the first 2 hours of rental only
- Never discount e-bike full-day rentals`,
  },
  {
    id: "merchant-lentos-cafe",
    cityId: "linz-demo",
    latitude: 48.3088,
    longitude: 14.2879,
    description:
      "Lentos Cafe — riverside cafe by the Lentos Kunstmuseum with light lunches, espresso, and terrace seating.",
    rules: `# Lentos Cafe — coupon rules
- Maximum discount: 18%
- Lunch and afternoon slots only (11:00-17:00)
- Tone: modern and calm, avoid hype language
- Mention terrace seating when weather is clear
- Never stack with museum member discounts`,
  },
  {
    id: "merchant-hauptplatz-apotheke",
    cityId: "linz-demo",
    latitude: 48.3062,
    longitude: 14.2851,
    description:
      "Hauptplatz Apotheke — central pharmacy at Hauptplatz with wellness essentials and same-day pickup.",
    rules: `# Hauptplatz Apotheke — coupon rules
- Maximum discount: 8%
- Only non-prescription products can be discounted
- Tone: clear, trustworthy, no casual slang
- Prioritise wellness and seasonal-care items
- Never discount prescription medication`,
  },
  {
    id: "merchant-landstrasse-bakery",
    cityId: "linz-demo",
    latitude: 48.3005,
    longitude: 14.2867,
    description:
      "Landstrasse Bakery — neighborhood bakery on Landstrasse with breads, pastries, and early commuter breakfast deals.",
    rules: `# Landstrasse Bakery — coupon rules
- Maximum discount: 20%
- Morning and lunch windows only (07:00-13:30)
- Tone: warm and local
- Highlight fresh-baked items and commuter timing
- Never discount pre-ordered celebration cakes`,
  },
  {
    id: "merchant-suedbahnhof-market",
    cityId: "linz-demo",
    latitude: 48.2922,
    longitude: 14.2928,
    description:
      "Suedbahnhof Market Stand — fresh produce and local snacks near Suedbahnhofmarkt with rotating daily specials.",
    rules: `# Suedbahnhof Market Stand — coupon rules
- Maximum discount: 15%
- Fresh products only; no alcohol discounts
- Tone: friendly, practical, short sentences
- Prefer end-of-day inventory balancing offers
- Never discount products flagged as premium local imports`,
  },
  {
    id: "merchant-urfahr-books",
    cityId: "linz-demo",
    latitude: 48.3146,
    longitude: 14.2871,
    description:
      "Urfahr Books — independent bookstore in Urfahr with contemporary fiction, travel guides, and weekend readings.",
    rules: `# Urfahr Books — coupon rules
- Maximum discount: 10%
- Books only; exclude magazines and gift cards
- Tone: thoughtful and concise
- Encourage browsing during rainy or cold weather
- Never discount newly released bestsellers`,
  },
];

async function main() {
  const demoOwner = await prisma.merchantOwner.upsert({
    where: { email: DEMO_OWNER_EMAIL },
    create: {
      email: DEMO_OWNER_EMAIL,
      passwordHash: hashPassword(DEMO_OWNER_PASSWORD),
    },
    update: {},
  });

  await prisma.merchant.deleteMany({
    where: { cityId: "stuttgart-demo" },
  });

  for (const merchant of merchants) {
    const merchantData = {
      ...merchant,
      name: getMerchantName(merchant.description),
      category: getMerchantCategory(merchant.id),
      ownerId: demoOwner.id,
    };
    await prisma.merchant.upsert({
      where: { id: merchant.id },
      create: merchantData,
      update: merchantData,
    });
    await prisma.couponRuleSet.upsert({
      where: { merchantId: merchant.id },
      create: buildRuleSetData(merchant.id, merchant.rules),
      update: buildRuleSetData(merchant.id, merchant.rules),
    });
  }
  console.log(`Seeded ${merchants.length} merchants.`);
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function getMerchantName(description: string) {
  return description.split(" — ")[0] ?? description;
}

function getMerchantCategory(merchantId: string): MerchantCategory {
  if (merchantId.includes("cafe") || merchantId.includes("eis")) return "CAFE";
  if (merchantId.includes("bistro") || merchantId.includes("bakery")) return "RESTAURANT";
  if (merchantId.includes("ars")) return "CULTURE";
  return "RETAIL";
}

function buildRuleSetData(merchantId: string, rulesMarkdown: string) {
  return {
    merchantId,
    maxDiscountPercent: getMaxDiscountPercent(rulesMarkdown),
    allowedWindows: getAllowedWindows(rulesMarkdown),
    exclusions: getExclusions(rulesMarkdown),
    tone: getTone(rulesMarkdown),
    validityMinutes: getValidityMinutes(rulesMarkdown),
    extraInstructions: "",
    rulesMarkdown,
    active: true,
  };
}

function getMaxDiscountPercent(rulesMarkdown: string) {
  const match = rulesMarkdown.match(/Maximum discount:\s*(\d+)%/i);
  return match ? Number(match[1]) : 15;
}

function getAllowedWindows(rulesMarkdown: string) {
  const lines = rulesMarkdown
    .split("\n")
    .filter((line) => /only|hours|windows|slots/i.test(line));
  return lines.length > 0 ? lines : ["Any open business hours"];
}

function getExclusions(rulesMarkdown: string) {
  return rulesMarkdown
    .split("\n")
    .filter((line) => /never|exclude|no discounts?|not groups/i.test(line));
}

function getTone(rulesMarkdown: string) {
  const match = rulesMarkdown.match(/Tone:\s*([^\n]+)/i);
  return match?.[1]?.trim() ?? "friendly and concise";
}

function getValidityMinutes(rulesMarkdown: string) {
  const match = rulesMarkdown.match(/valid for\s*(\d+)\s*minutes/i);
  return match ? Number(match[1]) : 15;
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
