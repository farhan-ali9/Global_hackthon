import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ZodError } from "zod";

import { createLlmCouponGenerator } from "./coupons/llmCouponGenerator";
import { prisma } from "./db";
import { couponRequestSchema, merchantListQuerySchema } from "./schemas";
import type { MerchantSummary } from "./types";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

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
      description: merchant.description,
      cityId: merchant.cityId,
      coordinates: {
        latitude: merchant.latitude,
        longitude: merchant.longitude,
      },
    }));

    response.json(summaries);
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
