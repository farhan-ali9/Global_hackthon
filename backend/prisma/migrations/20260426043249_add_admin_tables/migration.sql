/*
  Warnings:

  - Added the required column `updatedAt` to the `Merchant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'DRAFT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DemandState" AS ENUM ('QUIET', 'NORMAL', 'BUSY');

-- CreateEnum
CREATE TYPE "MerchantCategory" AS ENUM ('CAFE', 'RESTAURANT', 'RETAIL', 'CULTURE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('GENERATED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REDEEMED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('RECOMMENDED', 'COUPON_GENERATED', 'COUPON_ACCEPTED', 'COUPON_REDEEMED');

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" "MerchantCategory" NOT NULL DEFAULT 'CAFE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distanceMeters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "zoneId" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "rules" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "state" "DemandState" NOT NULL,
    "score" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantRule" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "maxDiscountPercent" INTEGER NOT NULL,
    "quietHours" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "anonymizedContext" JSONB NOT NULL,
    "uiSpec" JSONB NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'GENERATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantOwner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRuleSet" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "maxDiscountPercent" INTEGER NOT NULL DEFAULT 15,
    "allowedWindows" JSONB NOT NULL,
    "exclusions" JSONB NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'friendly and concise',
    "validityMinutes" INTEGER NOT NULL DEFAULT 15,
    "extraInstructions" TEXT NOT NULL DEFAULT '',
    "rulesMarkdown" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandSignal_merchantId_observedAt_idx" ON "DemandSignal"("merchantId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantRule_merchantId_key" ON "MerchantRule"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_offerId_key" ON "Redemption"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_token_key" ON "Redemption"("token");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOwner_email_key" ON "MerchantOwner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSession_tokenHash_key" ON "MerchantSession"("tokenHash");

-- CreateIndex
CREATE INDEX "MerchantSession_ownerId_idx" ON "MerchantSession"("ownerId");

-- CreateIndex
CREATE INDEX "MerchantSession_expiresAt_idx" ON "MerchantSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRuleSet_merchantId_key" ON "CouponRuleSet"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantAnalyticsEvent_merchantId_type_idx" ON "MerchantAnalyticsEvent"("merchantId", "type");

-- CreateIndex
CREATE INDEX "MerchantAnalyticsEvent_createdAt_idx" ON "MerchantAnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Merchant_ownerId_idx" ON "Merchant"("ownerId");

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MerchantOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MerchantOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRuleSet" ADD CONSTRAINT "CouponRuleSet_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAnalyticsEvent" ADD CONSTRAINT "MerchantAnalyticsEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
