CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MOBILE_MONEY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProvider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentProvider_code_key" ON "PaymentProvider"("code");
