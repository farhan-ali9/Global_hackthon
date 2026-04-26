import { createHash, randomBytes } from "node:crypto";

import type { MerchantCategory, PrismaClient } from "@prisma/client";
import type express from "express";

import {
  adminLoginSchema,
  adminMerchantSchema,
  adminRuleSetSchema,
  adminSignupSchema,
} from "./schemas";

const SESSION_COOKIE_NAME = "cw_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function registerAdminRoutes(app: express.Express, prisma: PrismaClient) {
  app.post("/admin/api/signup", async (request, response, next) => {
    try {
      const { email, password } = adminSignupSchema.parse(request.body);
      const owner = await prisma.merchantOwner.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashPassword(password),
        },
      });
      await createSession(response, prisma, owner.id);
      response.status(201).json({ owner: serializeOwner(owner) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/admin/api/login", async (request, response, next) => {
    try {
      const { email, password } = adminLoginSchema.parse(request.body);
      const owner = await prisma.merchantOwner.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!owner || owner.passwordHash !== hashPassword(password)) {
        throw httpError(401, "Invalid email or password");
      }
      await createSession(response, prisma, owner.id);
      response.json({ owner: serializeOwner(owner) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/admin/api/logout", async (request, response, next) => {
    try {
      const sessionToken = getSessionToken(request);
      if (sessionToken) {
        await prisma.merchantSession.deleteMany({
          where: { tokenHash: hashToken(sessionToken) },
        });
      }
      clearSessionCookie(response);
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/admin/api/me", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      response.json({ owner: serializeOwner(owner) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/admin/api/merchant", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const merchant = await findOwnerMerchant(prisma, owner.id);
      response.json({ merchant });
    } catch (error) {
      next(error);
    }
  });

  app.post("/admin/api/merchant", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const payload = adminMerchantSchema.parse(request.body);
      const existingMerchant = await findOwnerMerchant(prisma, owner.id);
      if (existingMerchant) {
        throw httpError(409, "Merchant already registered for this owner");
      }
      const merchant = await prisma.merchant.create({
        data: {
          id: createMerchantId(payload.name),
          ownerId: owner.id,
          name: payload.name,
          category: normalizeMerchantCategory(payload.category),
          description: payload.description,
          cityId: payload.cityId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          rules: buildRulesMarkdown(payload.name, defaultRuleSetInput()),
          ruleSet: {
            create: {
              ...defaultRuleSetInput(),
              rulesMarkdown: buildRulesMarkdown(payload.name, defaultRuleSetInput()),
            },
          },
        },
        include: { ruleSet: true },
      });
      response.status(201).json({ merchant });
    } catch (error) {
      next(error);
    }
  });

  app.put("/admin/api/merchant", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const payload = adminMerchantSchema.parse(request.body);
      const merchant = await findOwnerMerchant(prisma, owner.id);
      if (!merchant) {
        throw httpError(404, "Merchant has not been registered yet");
      }
      const updated = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          ...payload,
          category: normalizeMerchantCategory(payload.category),
        },
        include: { ruleSet: true },
      });
      response.json({ merchant: updated });
    } catch (error) {
      next(error);
    }
  });

  app.get("/admin/api/rules", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const merchant = await findOwnerMerchant(prisma, owner.id);
      if (!merchant) {
        throw httpError(404, "Merchant has not been registered yet");
      }
      response.json({ ruleSet: merchant.ruleSet });
    } catch (error) {
      next(error);
    }
  });

  app.put("/admin/api/rules", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const payload = adminRuleSetSchema.parse(request.body);
      const merchant = await findOwnerMerchant(prisma, owner.id);
      if (!merchant) {
        throw httpError(404, "Merchant has not been registered yet");
      }
      const rulesMarkdown = buildRulesMarkdown(merchant.name, payload);
      const ruleSet = await prisma.couponRuleSet.upsert({
        where: { merchantId: merchant.id },
        create: {
          merchantId: merchant.id,
          ...payload,
          rulesMarkdown,
        },
        update: {
          ...payload,
          rulesMarkdown,
        },
      });
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { rules: rulesMarkdown },
      });
      response.json({ ruleSet });
    } catch (error) {
      next(error);
    }
  });

  app.get("/admin/api/analytics/summary", async (request, response, next) => {
    try {
      const owner = await requireOwner(request, prisma);
      const merchant = await findOwnerMerchant(prisma, owner.id);
      if (!merchant) {
        response.json({
          merchant: null,
          counts: emptyAnalyticsCounts(),
          conversionRates: { generatedToAccepted: 0, acceptedToRedeemed: 0 },
          recentEvents: [],
        });
        return;
      }

      const events = await prisma.merchantAnalyticsEvent.findMany({
        where: { merchantId: merchant.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const counts = events.reduce((summary, event) => {
        summary[event.type] += 1;
        return summary;
      }, emptyAnalyticsCounts());
      response.json({
        merchant,
        counts,
        conversionRates: {
          generatedToAccepted: rate(counts.COUPON_ACCEPTED, counts.COUPON_GENERATED),
          acceptedToRedeemed: rate(counts.COUPON_REDEEMED, counts.COUPON_ACCEPTED),
        },
        recentEvents: events.slice(0, 20),
      });
    } catch (error) {
      next(error);
    }
  });
}

async function requireOwner(request: express.Request, prisma: PrismaClient) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    throw httpError(401, "Not authenticated");
  }

  const session = await prisma.merchantSession.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    include: { owner: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    throw httpError(401, "Session expired");
  }
  return session.owner;
}

async function createSession(
  response: express.Response,
  prisma: PrismaClient,
  ownerId: string,
) {
  const token = randomBytes(32).toString("hex");
  await prisma.merchantSession.create({
    data: {
      ownerId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000,
    )}`,
  );
}

async function findOwnerMerchant(prisma: PrismaClient, ownerId: string) {
  return prisma.merchant.findFirst({
    where: { ownerId },
    include: { ruleSet: true },
    orderBy: { createdAt: "asc" },
  });
}

type RuleSetInput = {
  maxDiscountPercent: number;
  allowedWindows: string[];
  exclusions: string[];
  tone: string;
  validityMinutes: number;
  extraInstructions: string;
  active: boolean;
};

function defaultRuleSetInput(): RuleSetInput {
  return {
    maxDiscountPercent: 15,
    allowedWindows: ["Any open business hours"],
    exclusions: [],
    tone: "friendly and concise",
    validityMinutes: 15,
    extraInstructions: "",
    active: true,
  };
}

function buildRulesMarkdown(merchantName: string, ruleSet: RuleSetInput) {
  const lines = [
    `# ${merchantName} — coupon rules`,
    `- Maximum discount: ${ruleSet.maxDiscountPercent}%`,
    `- Allowed windows: ${ruleSet.allowedWindows.join("; ") || "Any open business hours"}`,
    `- Tone: ${ruleSet.tone}`,
    `- Coupons must be valid for ${ruleSet.validityMinutes} minutes only`,
    ruleSet.exclusions.length > 0
      ? `- Exclusions: ${ruleSet.exclusions.join("; ")}`
      : "- Exclusions: none",
    ruleSet.extraInstructions ? `- Extra instructions: ${ruleSet.extraInstructions}` : null,
    ruleSet.active ? "- Campaign status: active" : "- Campaign status: paused",
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}

function createMerchantId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `merchant-${slug || "store"}-${randomBytes(3).toString("hex")}`;
}

function normalizeMerchantCategory(category: string): MerchantCategory {
  const normalized = category.trim().toUpperCase();
  if (normalized === "RESTAURANT" || normalized === "FOOD") return "RESTAURANT";
  if (normalized === "CULTURE") return "CULTURE";
  if (normalized === "RETAIL" || normalized === "WELLNESS" || normalized === "MARKET") {
    return "RETAIL";
  }
  return "CAFE";
}

function getSessionToken(request: express.Request) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...valueParts] = cookie.trim().split("=");
      return [key, valueParts.join("=")];
    }),
  );
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

function clearSessionCookie(response: express.Response) {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  );
}

function serializeOwner(owner: { id: string; email: string; createdAt: Date }) {
  return {
    id: owner.id,
    email: owner.email,
    createdAt: owner.createdAt,
  };
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function emptyAnalyticsCounts() {
  return {
    RECOMMENDED: 0,
    COUPON_GENERATED: 0,
    COUPON_ACCEPTED: 0,
    COUPON_REDEEMED: 0,
  };
}

function rate(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}
