import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const merchants = [
    {
      id: "merchant-cafe-mueller",
      name: "Cafe Mueller",
      category: "CAFE" as const,
      cityId: "stuttgart-demo",
      zoneId: "old-town",
      distanceMeters: 80,
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
      cityId: "stuttgart-demo",
      zoneId: "market-square",
      distanceMeters: 220,
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
      cityId: "stuttgart-demo",
      zoneId: "old-town",
      distanceMeters: 140,
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
  ];

  for (const merchant of merchants) {
    await prisma.merchant.upsert({
      where: { id: merchant.id },
      create: {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        cityId: merchant.cityId,
        zoneId: merchant.zoneId,
        distanceMeters: merchant.distanceMeters,
        rule: {
          create: merchant.rule,
        },
        demandSignals: {
          create: merchant.demand,
        },
      },
      update: {
        name: merchant.name,
        category: merchant.category,
        cityId: merchant.cityId,
        zoneId: merchant.zoneId,
        distanceMeters: merchant.distanceMeters,
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
