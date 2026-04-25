import { DemandState, Prisma, type PrismaClient } from "@prisma/client";

import type {
  GeneratedOfferResponse,
  OfferUiSpec,
  SelectedOfferRequest,
} from "../types";

type MerchantWithMetadata = NonNullable<Awaited<ReturnType<typeof loadMerchant>>>;

export type OfferGenerator = {
  generateOffer: (
    request: SelectedOfferRequest,
  ) => Promise<GeneratedOfferResponse>;
};

export function createDeterministicOfferGenerator(
  prisma: PrismaClient,
): OfferGenerator {
  return {
    async generateOffer(request) {
      const selected = await loadMerchant(
        prisma,
        request.merchantId,
        request.intent.cityId,
      );

      if (!selected) {
        throw Object.assign(new Error("Merchant is not available"), {
          statusCode: 404,
        });
      }

      const demandState = selected.demandSignals[0]?.state ?? DemandState.NORMAL;
      const discountPercent = chooseDiscount(
        selected.rule?.maxDiscountPercent ?? 10,
        demandState,
        request.intent,
      );
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const explanationTags = buildExplanationTags(
        demandState,
        request.intent,
      );
      const ui = buildUiSpec(
        selected,
        discountPercent,
        request.intent,
        explanationTags,
      );

      const offer = await prisma.offer.create({
        data: {
          merchantId: selected.id,
          intent: request.intent as Prisma.InputJsonValue,
          uiSpec: ui as Prisma.InputJsonValue,
          discountPercent,
          expiresAt,
        },
        include: {
          merchant: true,
        },
      });

      return {
        offer: {
          id: offer.id,
          merchant: {
            id: offer.merchant.id,
            name: offer.merchant.name,
            category: offer.merchant.category.toLowerCase(),
            distanceMeters: offer.merchant.distanceMeters,
          },
          discountPercent: offer.discountPercent,
          expiresAt: offer.expiresAt.toISOString(),
          status: "generated",
          explanationTags,
        },
        ui,
      };
    },
  };
}

async function loadMerchant(
  prisma: PrismaClient,
  merchantId: string,
  cityId: string,
) {
  return prisma.merchant.findFirst({
    where: {
      id: merchantId,
      active: true,
      cityId,
    },
    include: {
      rule: true,
      demandSignals: {
        orderBy: {
          observedAt: "desc",
        },
        take: 1,
      },
    },
  });
}

function chooseDiscount(
  maxDiscountPercent: number,
  demandState: DemandState,
  context: SelectedOfferRequest["intent"],
) {
  const baseDiscount =
    demandState === DemandState.QUIET
      ? 15
      : demandState === DemandState.NORMAL
        ? 10
        : 5;
  const weatherBoost =
    context.weatherBucket === "cold" || context.weatherBucket === "rain" ? 3 : 0;

  return Math.max(0, Math.min(maxDiscountPercent, baseDiscount + weatherBoost));
}

function buildExplanationTags(
  demandState: DemandState,
  context: SelectedOfferRequest["intent"],
) {
  const tags = [context.timeOfDay, context.weatherBucket, demandState.toLowerCase()];

  if (context.intentLabels.length > 0) tags.push(...context.intentLabels);

  return tags;
}

function buildUiSpec(
  merchant: MerchantWithMetadata,
  discountPercent: number,
  context: SelectedOfferRequest["intent"],
  explanationTags: string[],
): OfferUiSpec {
  const warmContext =
    context.weatherBucket === "cold" || context.weatherBucket === "rain";
  const tone =
    warmContext ? "warm" : context.timeOfDay === "lunch" ? "fresh" : "focused";
  const headline = warmContext
    ? "Warm up nearby"
    : context.timeOfDay === "lunch"
      ? "Lunch close by"
      : "A relevant stop nearby";

  return {
    component: "offer_card_v1",
    tone,
    headline,
    body: `${merchant.name} is ${merchant.distanceMeters} m away with ${discountPercent}% off for this moment.`,
    ctaLabel: "Accept offer",
    badges: [
      `${discountPercent}% off`,
      `${merchant.distanceMeters} m`,
      ...explanationTags.slice(0, 2),
    ],
    colorTokens: {
      background: "#FFFFFF",
      accent: warmContext ? "#7C3F1D" : "#0E6E55",
    },
    actions: [
      {
        id: "accept_offer",
        label: "Accept offer",
        type: "primary",
      },
      {
        id: "decline_offer",
        label: "Not now",
        type: "secondary",
      },
    ],
  };
}
