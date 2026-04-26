import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ZodError } from "zod";

import { createLlmCouponGenerator } from "./coupons/llmCouponGenerator";
import { prisma } from "./db";
import { createDeterministicOfferGenerator } from "./generator/deterministicOfferGenerator";
import {
  couponRequestSchema,
  merchantListQuerySchema,
  selectedOfferRequestSchema,
} from "./schemas";
import type {
  MerchantCandidate,
  MerchantSummary,
  RedemptionResponse,
} from "./types";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const offerGenerator = createDeterministicOfferGenerator(prisma);

const couponGenerator = createLlmCouponGenerator(prisma, {
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-haiku-4-5",
});

app.use(
  cors({
    origin:
      corsOrigin === "*"
        ? "*"
        : corsOrigin.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/merchants", async (request, response, next) => {
  try {
    const { cityId } = merchantListQuerySchema.parse(request.query);
    const merchants = await prisma.merchant.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { id: "asc" },
    });

    const summaries: MerchantSummary[] = merchants.map((merchant) => ({
      id: merchant.id,
      description: merchant.description ?? merchant.name,
      cityId: merchant.cityId,
      coordinates: {
        latitude: merchant.latitude ?? 0,
        longitude: merchant.longitude ?? 0,
      },
    }));

    response.json(summaries);
  } catch (error) {
    next(error);
  }
});

app.get("/merchants/candidates", async (request, response, next) => {
  try {
    const cityId = String(request.query.cityId ?? "").trim();

    if (!cityId) {
      response.status(400).json({ error: "cityId is required" });
      return;
    }

    const merchants = await prisma.merchant.findMany({
      where: {
        active: true,
        cityId,
      },
      orderBy: {
        distanceMeters: "asc",
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

    response.json({
      candidates: merchants.map(toMerchantCandidate),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/offers/generate", async (request, response, next) => {
  try {
    const selectedOfferRequest = selectedOfferRequestSchema.parse(request.body);
    const generatedOffer = await offerGenerator.generateOffer(selectedOfferRequest);

    response.status(201).json(generatedOffer);
  } catch (error) {
    next(error);
  }
});

app.post("/coupons/generate", async (request, response, next) => {
  try {
    const couponRequest = couponRequestSchema.parse(request.body);
    const coupon = await couponGenerator.generate(couponRequest);
    response.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
});

app.post("/offers/:offerId/accept", async (request, response, next) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: request.params.offerId },
      include: { redemption: true },
    });

    if (!offer) {
      response.status(404).json({ error: "Offer not found" });
      return;
    }

    if (offer.expiresAt.getTime() <= Date.now()) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "EXPIRED" },
      });
      response.status(409).json({ error: "Offer expired" });
      return;
    }

    if (offer.redemption) {
      response.json(toRedemptionResponse(offer.redemption));
      return;
    }

    const redemption = await prisma.redemption.create({
      data: {
        offerId: offer.id,
        merchantId: offer.merchantId,
        token: await createUniqueToken(),
        expiresAt: offer.expiresAt,
      },
    });

    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED" },
    });

    response.status(201).json(toRedemptionResponse(redemption));
  } catch (error) {
    next(error);
  }
});

app.get("/redemptions/:token", async (request, response, next) => {
  try {
    const redemption = await prisma.redemption.findUnique({
      where: { token: request.params.token.toUpperCase() },
    });

    if (!redemption) {
      response.status(404).json({ error: "Redemption not found" });
      return;
    }

    response.json(toRedemptionResponse(redemption));
  } catch (error) {
    next(error);
  }
});

app.post("/redemptions/:token/validate", async (request, response, next) => {
  try {
    const token = request.params.token.toUpperCase();
    const redemption = await prisma.redemption.findUnique({
      where: { token },
    });

    if (!redemption) {
      response.status(404).json({ error: "Redemption not found" });
      return;
    }

    if (redemption.status === "REDEEMED") {
      response.json(toRedemptionResponse(redemption));
      return;
    }

    if (redemption.expiresAt.getTime() <= Date.now()) {
      const expiredRedemption = await prisma.redemption.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      await prisma.offer.update({
        where: { id: redemption.offerId },
        data: { status: "EXPIRED" },
      });
      response.status(409).json(toRedemptionResponse(expiredRedemption));
      return;
    }

    const redeemed = await prisma.redemption.update({
      where: { token },
      data: { status: "REDEEMED" },
    });
    await prisma.offer.update({
      where: { id: redemption.offerId },
      data: { status: "REDEEMED" },
    });

    response.json(toRedemptionResponse(redeemed));
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ZodError) {
      response
        .status(400)
        .json({ error: "Invalid request", details: error.flatten() });
      return;
    }

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;

    console.error(error);
    response.status(statusCode).json({
      error:
        statusCode === 500
          ? "Internal server error"
          : (error as Error).message,
    });
  },
);

app.listen(port, () => {
  console.log(`City Wallet API listening on port ${port}`);
});

function toMerchantCandidate(merchant: {
  id: string;
  name: string;
  category: "CAFE" | "RESTAURANT" | "RETAIL" | "CULTURE";
  cityId: string;
  zoneId: string;
  distanceMeters: number;
  rule: {
    maxDiscountPercent: number;
    quietHours: string;
  } | null;
  demandSignals: {
    state: "QUIET" | "NORMAL" | "BUSY";
    score: number;
    observedAt: Date;
  }[];
}): MerchantCandidate {
  const latestDemand = merchant.demandSignals[0];

  return {
    id: merchant.id,
    name: merchant.name,
    category: merchant.category.toLowerCase() as MerchantCandidate["category"],
    cityId: merchant.cityId,
    zoneId: merchant.zoneId,
    distanceMeters: merchant.distanceMeters,
    rule: merchant.rule
      ? {
          maxDiscountPercent: merchant.rule.maxDiscountPercent,
          quietHours: merchant.rule.quietHours,
        }
      : null,
    demand: latestDemand
      ? {
          state: latestDemand.state.toLowerCase() as NonNullable<
            MerchantCandidate["demand"]
          >["state"],
          score: latestDemand.score,
          observedAt: latestDemand.observedAt.toISOString(),
        }
      : null,
  };
}

async function createUniqueToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = `CITY-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const existing = await prisma.redemption.findUnique({ where: { token } });

    if (!existing) return token;
  }

  throw new Error("Could not generate unique redemption token");
}

function toRedemptionResponse(redemption: {
  token: string;
  offerId: string;
  merchantId: string;
  status: "PENDING" | "REDEEMED" | "EXPIRED";
  expiresAt: Date;
}): RedemptionResponse {
  return {
    token: redemption.token,
    offerId: redemption.offerId,
    merchantId: redemption.merchantId,
    status: redemption.status.toLowerCase() as RedemptionResponse["status"],
    expiresAt: redemption.expiresAt.toISOString(),
  };
}
