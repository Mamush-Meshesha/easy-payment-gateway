-- CreateTable: payment_projections
-- This is a READ MODEL projection — NOT the financial source of truth.
-- Populated from Kafka payment.events topic. Never modified or deleted after creation.
CREATE TABLE "payment_projections" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "merchant_reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_method" TEXT,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_event_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transaction_projections
CREATE TABLE "transaction_projections" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "status" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_projections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: payment_projections
CREATE UNIQUE INDEX "payment_projections_payment_id_key" ON "payment_projections"("payment_id");
CREATE INDEX "payment_projections_merchant_id_status_idx" ON "payment_projections"("merchant_id", "status");
CREATE INDEX "payment_projections_merchant_id_created_at_idx" ON "payment_projections"("merchant_id", "created_at");
CREATE INDEX "payment_projections_merchant_id_currency_idx" ON "payment_projections"("merchant_id", "currency");

-- CreateIndex: transaction_projections
CREATE UNIQUE INDEX "transaction_projections_transaction_id_key" ON "transaction_projections"("transaction_id");
CREATE INDEX "transaction_projections_merchant_id_status_idx" ON "transaction_projections"("merchant_id", "status");
CREATE INDEX "transaction_projections_merchant_id_created_at_idx" ON "transaction_projections"("merchant_id", "created_at");
