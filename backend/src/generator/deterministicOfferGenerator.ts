import { DemandState, MerchantCategory, Prisma, type PrismaClient } from "@prisma/client";

import type {
  AnonymizedContextPayload,
  GeneratedOfferResponse,
  OfferUiSpec,
} from "../types";

type MerchantCandidate = Awaited<
  ReturnType<typeof loadMerchantCandidates>
>[number];

export type OfferGenerator = {
  generateOffer: (
    context: AnonymizedContextPayload,
  ) => Promise<GeneratedOfferResponse>;
};

export function createDeterministicOfferGenerator(
  prisma: PrismaClient,
): OfferGenerator {
  return {
    async generateOffer(context) {
      const candidates = await loadMerchantCandidates(prisma, context.cityId);

      if (candidates.length === 0) {
        throw Object.assign(new Error("No active merchants available"), {
          statusCode: 404,
        });
      }

      const ranked = candidates
        .map((merchant) => ({
          merchant,
          score: scoreMerchant(merchant, context),
        }))
        .sort((left, right) => right.score - left.score);

      const selected = ranked[0].merchant;
      const demandState = selected.demandSignals[0]?.state ?? DemandState.NORMAL;
      const discountPercent = chooseDiscount(
        selected.rule?.maxDiscountPercent ?? 10,
        demandState,
        context,
      );
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const explanationTags = buildExplanationTags(selected, demandState, context);
      const ui = buildUiSpec(selected, discountPercent, context, explanationTags);

      const offer = await prisma.offer.create({
        data: {
          merchantId: selected.id,
          anonymizedContext: context as Prisma.InputJsonValue,
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

async function loadMerchantCandidates(prisma: PrismaClient, cityId: string) {
  return prisma.merchant.findMany({
    where: {
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

function scoreMerchant(
  merchant: MerchantCandidate,
  context: AnonymizedContextPayload,
) {
  let score = 0;
  const demandState = merchant.demandSignals[0]?.state ?? DemandState.NORMAL;

  if (merchant.zoneId === context.zoneId) score += 25;
  if (demandState === DemandState.QUIET) score += 30;
  if (demandState === DemandState.NORMAL) score += 10;
  if (demandState === DemandState.BUSY) score -= 30;

  if (
    merchant.category === MerchantCategory.CAFE &&
    (context.intentLabels.includes("seeking_warmth") ||
      context.weatherBucket === "cold" ||
      context.weatherBucket === "rain")
  ) {
    score += 25;
  }

  if (
    (merchant.category === MerchantCategory.CAFE ||
      merchant.category === MerchantCategory.RESTAURANT) &&
    (context.intentLabels.includes("hungry") || context.timeOfDay === "lunch")
  ) {
    score += 20;
  }

  if (
    merchant.category === MerchantCategory.RETAIL &&
    context.intentLabels.includes("browsing")
  ) {
    score += 15;
  }

  if (context.demandTags.includes("quiet")) score += 10;

  return score;
}

function chooseDiscount(
  maxDiscountPercent: number,
  demandState: DemandState,
  context: AnonymizedContextPayload,
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
  merchant: MerchantCandidate,
  demandState: DemandState,
  context: AnonymizedContextPayload,
) {
  const tags = [context.timeOfDay, context.weatherBucket, demandState.toLowerCase()];

  if (merchant.zoneId === context.zoneId) tags.push("nearby-zone");
  if (context.intentLabels.length > 0) tags.push(...context.intentLabels);

  return tags;
}

function buildUiSpec(
  merchant: MerchantCandidate,
  discountPercent: number,
  context: AnonymizedContextPayload,
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
