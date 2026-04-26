CREATE TYPE "MerchantCategory" AS ENUM ('CAFE', 'RESTAURANT', 'RETAIL', 'CULTURE');
CREATE TYPE "DemandState" AS ENUM ('QUIET', 'NORMAL', 'BUSY');
CREATE TYPE "OfferStatus" AS ENUM ('GENERATED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REDEEMED');
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED');

CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MerchantCategory" NOT NULL,
    "cityId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "state" "DemandState" NOT NULL,
    "score" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "MerchantRule_merchantId_key" ON "MerchantRule"("merchantId");
CREATE INDEX "DemandSignal_merchantId_observedAt_idx" ON "DemandSignal"("merchantId", "observedAt");
CREATE UNIQUE INDEX "Redemption_offerId_key" ON "Redemption"("offerId");
CREATE UNIQUE INDEX "Redemption_token_key" ON "Redemption"("token");

ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
