import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { registerAdminRoutes } from "./admin";
import { createLlmCouponGenerator } from "./coupons/llmCouponGenerator";
import { prisma } from "./db";
import {
  analyticsEventSchema,
  couponRequestSchema,
  merchantListQuerySchema,
} from "./schemas";
import type { MerchantSummary } from "./types";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

const couponGenerator = createLlmCouponGenerator(prisma, {
  apiKey: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
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
app.use("/admin", express.static(path.join(process.cwd(), "public/admin")));
registerAdminRoutes(app, prisma);

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

    const summaries: MerchantSummary[] = [];
    for (const merchant of merchants) {
      if (
        merchant.description === null ||
        merchant.latitude === null ||
        merchant.longitude === null
      ) {
        continue;
      }
      summaries.push({
        id: merchant.id,
        name: merchant.name ?? getMerchantName(merchant.description),
        category: getMerchantCategory(merchant.description, merchant.category),
        description: merchant.description,
        cityId: merchant.cityId,
        coordinates: {
          latitude: merchant.latitude,
          longitude: merchant.longitude,
        },
      });
    }

    response.json(summaries);
  } catch (error) {
    next(error);
  }
});

app.post("/coupons/generate", async (request, response, next) => {
  const requestId = crypto.randomUUID();
  try {
    const couponRequest = couponRequestSchema.parse(request.body);
    console.info("[coupons.generate] request received", {
      requestId,
      merchantId: couponRequest.merchantId,
      userIntent: couponRequest.userIntent,
      contextKeys: Object.keys(couponRequest.context),
    });
    const coupon = await couponGenerator.generate(couponRequest);
    console.info("[coupons.generate] request succeeded", {
      requestId,
      merchantId: couponRequest.merchantId,
      headline: coupon.headline,
    });
    response.status(201).json(coupon);
  } catch (error) {
    console.error("[coupons.generate] request failed", {
      requestId,
      error: toErrorLog(error),
    });
    next(withRequestId(error, requestId));
  }
});

app.post("/analytics/events", async (request, response, next) => {
  try {
    const event = analyticsEventSchema.parse(request.body);
    await prisma.merchantAnalyticsEvent.create({
      data: {
        ...event,
        metadata: event.metadata ? toJsonObject(event.metadata) : undefined,
      },
    });
    response.status(202).json({ ok: true });
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
      const requestId = getErrorRequestId(error);
      console.warn("[api.validation]", {
        requestId,
        issues: error.issues,
      });
      response
        .status(400)
        .json({
          error: "Invalid request",
          details: error.flatten(),
          ...(requestId ? { requestId } : {}),
        });
      return;
    }

    const statusCode = getErrorStatusCode(error);
    const requestId = getErrorRequestId(error);
    const message =
      statusCode === 500 && !isExposedError(error)
        ? "Internal server error"
        : getErrorMessage(error);

    console.error("[api.error]", {
      requestId,
      statusCode,
      error: toErrorLog(error),
    });
    response.status(statusCode).json({
      error: message,
      ...(requestId ? { requestId } : {}),
    });
  },
);

app.listen(port, () => {
  console.log(`City Wallet API listening on port ${port}`);
});

function toJsonObject(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function getMerchantName(description: string) {
  return description.split(" — ")[0] ?? description;
}

function getMerchantCategory(description: string, rawCategory: string | null | undefined) {
  if (typeof rawCategory === "string" && rawCategory.trim().length > 0) {
    return rawCategory.toLowerCase();
  }

  const normalizedDescription = description.toLowerCase();
  if (normalizedDescription.includes("coffee") || normalizedDescription.includes("cafe")) {
    return "coffee";
  }
  if (normalizedDescription.includes("bakery") || normalizedDescription.includes("bread")) {
    return "bakery";
  }
  if (normalizedDescription.includes("restaurant") || normalizedDescription.includes("lunch")) {
    return "restaurant";
  }
  return "local";
}

function withRequestId(error: unknown, requestId: string) {
  if (error instanceof Error) {
    return Object.assign(error, { requestId });
  }

  return Object.assign(new Error(String(error)), { requestId });
}

function getErrorStatusCode(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
    ? error.statusCode
    : 500;
}

function getErrorRequestId(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "requestId" in error &&
    typeof error.requestId === "string"
    ? error.requestId
    : undefined;
}

function isExposedError(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "expose" in error &&
    error.expose === true;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Request failed";
}

function toErrorLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}
