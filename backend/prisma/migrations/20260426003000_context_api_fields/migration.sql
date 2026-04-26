DO $$
BEGIN
  CREATE TYPE "MerchantCategory" AS ENUM ('CAFE', 'RESTAURANT', 'RETAIL', 'CULTURE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "DemandState" AS ENUM ('QUIET', 'NORMAL', 'BUSY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('GENERATED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REDEEMED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "category" "MerchantCategory" NOT NULL DEFAULT 'CAFE';
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "zoneId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "distanceMeters" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "rules" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Merchant" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Merchant" ALTER COLUMN "latitude" DROP NOT NULL;
ALTER TABLE "Merchant" ALTER COLUMN "longitude" DROP NOT NULL;
ALTER TABLE "Merchant" ALTER COLUMN "rules" DROP NOT NULL;
ALTER TABLE "Merchant" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "MerchantRule" (
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

CREATE TABLE IF NOT EXISTS "DemandSignal" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "state" "DemandState" NOT NULL,
    "score" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Offer" (
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

CREATE TABLE IF NOT EXISTS "Redemption" (
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

CREATE INDEX IF NOT EXISTS "Merchant_cityId_idx" ON "Merchant"("cityId");
CREATE UNIQUE INDEX IF NOT EXISTS "MerchantRule_merchantId_key" ON "MerchantRule"("merchantId");
CREATE INDEX IF NOT EXISTS "DemandSignal_merchantId_observedAt_idx" ON "DemandSignal"("merchantId", "observedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Redemption_offerId_key" ON "Redemption"("offerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Redemption_token_key" ON "Redemption"("token");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MerchantRule_merchantId_fkey') THEN
    ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DemandSignal_merchantId_fkey') THEN
    ALTER TABLE "DemandSignal" ADD CONSTRAINT "DemandSignal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_merchantId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Redemption_offerId_fkey') THEN
    ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Redemption_merchantId_fkey') THEN
    ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
