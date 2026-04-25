CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rules" TEXT NOT NULL,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Merchant_cityId_idx" ON "Merchant"("cityId");
