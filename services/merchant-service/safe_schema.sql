-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "country" VARCHAR(3) NOT NULL,
    "defaultCurrency" VARCHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL DEFAULT 'SECRET',
    "environment" TEXT NOT NULL DEFAULT 'LIVE',
    "keyPrefix" VARCHAR(50) NOT NULL,
    "keyLast4" VARCHAR(4) NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "rawKey" VARCHAR(255),
    "name" VARCHAR(100),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'LIVE',
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "secondarySecret" TEXT,
    "secondaryExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderConfig" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "configRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantLimit" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "minAmount" BIGINT NOT NULL,
    "maxAmount" BIGINT NOT NULL,
    "dailyLimit" BIGINT,
    "monthlyLimit" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantPreference" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'ETB',
    "callbackUrl" TEXT,
    "returnUrl" TEXT,
    "refundWebhookUrl" TEXT,
    "retryPaymentInterval" INTEGER NOT NULL DEFAULT 60,
    "redirectTimeout" INTEGER NOT NULL DEFAULT 0,
    "dashboardTheme" TEXT NOT NULL DEFAULT 'CLASSIC',
    "transactionFeePayer" TEXT NOT NULL DEFAULT 'MERCHANT',
    "transferFeePayer" TEXT NOT NULL DEFAULT 'MERCHANT',
    "emailImportantNotifs" BOOLEAN NOT NULL DEFAULT true,
    "emailCustomerReceipts" BOOLEAN NOT NULL DEFAULT false,
    "transactionReceiptToMe" BOOLEAN NOT NULL DEFAULT true,
    "financeEmail" TEXT,
    "transferApprovalMethod" TEXT NOT NULL DEFAULT 'OTP',
    "approvalUrl" TEXT,
    "approvalSecret" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantPaymentMethod" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "methodCode" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MerchantPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycProfile" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "businessName" TEXT,
    "registrationNo" TEXT,
    "taxId" TEXT,
    "businessType" TEXT,
    "websiteUrl" TEXT,
    "supportEmail" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "expectedVolume" TEXT,
    "representativeName" TEXT,
    "representativeDob" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "kycProfileId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "s3Uri" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_merchantId_idx" ON "ApiKey"("merchantId");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderConfig_merchantId_providerId_key" ON "ProviderConfig"("merchantId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantLimit_merchantId_currency_key" ON "MerchantLimit"("merchantId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPreference_merchantId_key" ON "MerchantPreference"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantPaymentMethod_merchantId_methodCode_key" ON "MerchantPaymentMethod"("merchantId", "methodCode");

-- CreateIndex
CREATE UNIQUE INDEX "KycProfile_merchantId_key" ON "KycProfile"("merchantId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderConfig" ADD CONSTRAINT "ProviderConfig_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantLimit" ADD CONSTRAINT "MerchantLimit_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPreference" ADD CONSTRAINT "MerchantPreference_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantPaymentMethod" ADD CONSTRAINT "MerchantPaymentMethod_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycProfile" ADD CONSTRAINT "KycProfile_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_kycProfileId_fkey" FOREIGN KEY ("kycProfileId") REFERENCES "KycProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

