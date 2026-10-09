-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "delivery_key" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "channel" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "subject" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "lease_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_delivery_key_key" ON "notification_logs"("delivery_key");

-- CreateIndex
CREATE INDEX "notification_logs_merchant_id_created_at_idx" ON "notification_logs"("merchant_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_next_retry_at_idx" ON "notification_logs"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "notification_logs_event_id_idx" ON "notification_logs"("event_id");
