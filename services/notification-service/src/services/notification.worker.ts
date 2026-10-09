import prisma from '../dal/prisma';
import { Prisma } from '@prisma/client';
import { EmailSender, RetryableError, NonRetryableError } from './email.sender';
import { logger } from '../utils/logger';

export class NotificationWorker {
  private isRunning = false;
  private timeoutId?: NodeJS.Timeout;

  constructor(private readonly emailSender: EmailSender) {}

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const interval = parseInt(process.env.NOTIFICATION_WORKER_INTERVAL_SECONDS || '5', 10) * 1000;
    
    logger.info(`Starting NotificationWorker (interval: ${interval}ms)`);
    
    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.processBatch();
        await this.recoverStuckDeliveries();
      } catch (err: any) {
        logger.error('NotificationWorker error', { error: err.message });
      } finally {
        if (this.isRunning) {
          this.timeoutId = setTimeout(loop, interval);
        }
      }
    };
    
    this.timeoutId = setTimeout(loop, 0);
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    logger.info('NotificationWorker stopped');
  }

  private async processBatch() {
    // 1. Claim records using FOR UPDATE SKIP LOCKED
    const limit = 50;
    const claimedIds = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM notification_logs
      WHERE status IN ('PENDING', 'RETRY_WAIT')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      ORDER BY next_retry_at ASC NULLS FIRST, created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (claimedIds.length === 0) return;

    const ids = claimedIds.map((c) => c.id);

    // 2. Transition to DELIVERING with a lease
    const leaseMinutes = 5;
    await prisma.$executeRaw`
      UPDATE notification_logs
      SET status = 'DELIVERING',
          lease_until = NOW() + (interval '1 minute' * ${leaseMinutes}),
          updated_at = NOW()
      WHERE id IN (${Prisma.join(ids)})
    `;

    // Fetch the full records to process
    const records = await prisma.notificationLog.findMany({
      where: { id: { in: ids } }
    });

    // 3. Process concurrently (could be throttled)
    await Promise.allSettled(records.map((r) => this.processSingle(r)));
  }

  private async recoverStuckDeliveries() {
    // Revert records stuck in DELIVERING past their lease
    const result = await prisma.$executeRaw`
      UPDATE notification_logs
      SET status = 'RETRY_WAIT',
          next_retry_at = NOW(),
          updated_at = NOW()
      WHERE status = 'DELIVERING'
        AND lease_until < NOW()
    `;
    
    if (result > 0) {
      logger.warn(`Recovered ${result} stuck DELIVERING records`);
    }
  }

  private async processSingle(record: any) {
    try {
      if (record.channel === 'EMAIL') {
        if (!record.recipientEmail) throw new NonRetryableError('Missing recipient email');
        
        await this.emailSender.send({
          to: record.recipientEmail,
          subject: record.subject ?? 'Payment Gateway Notification',
          text: this.renderText(record.templateId, record.payload as Record<string, unknown>),
        });
      } else {
        throw new NonRetryableError(`Channel ${record.channel} not supported`);
      }

      // Success
      await prisma.notificationLog.update({
        where: { id: record.id },
        data: {
          status: 'SENT',
          deliveredAt: new Date(),
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
          lastErrorCode: null,
          lastErrorMessage: null,
        }
      });
      logger.info('Notification sent successfully', { deliveryKey: record.deliveryKey });

    } catch (err: any) {
      const isRetryable = err instanceof RetryableError;
      const attemptCount = record.attemptCount + 1;
      const maxRetries = parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10);
      
      const shouldRetry = isRetryable && attemptCount <= maxRetries;
      
      if (shouldRetry) {
        const nextRetryAt = this.calculateBackoff(attemptCount);
        
        await prisma.notificationLog.update({
          where: { id: record.id },
          data: {
            status: 'RETRY_WAIT',
            attemptCount,
            lastAttemptAt: new Date(),
            nextRetryAt,
            lastErrorCode: err.code || null,
            lastErrorMessage: err.message,
          }
        });
        logger.warn('Notification delivery failed, scheduled retry', { 
          deliveryKey: record.deliveryKey, 
          attempt: attemptCount,
          nextRetryAt,
          error: err.message
        });
      } else {
        // Exhausted or non-retryable
        await prisma.notificationLog.update({
          where: { id: record.id },
          data: {
            status: 'DEAD_LETTER',
            attemptCount,
            lastAttemptAt: new Date(),
            lastErrorCode: err.code || null,
            lastErrorMessage: err.message,
          }
        });
        logger.error('Notification delivery permanently failed (DEAD_LETTER)', { 
          deliveryKey: record.deliveryKey,
          reason: isRetryable ? 'Retries exhausted' : 'Non-retryable error',
          error: err.message
        });
      }
    }
  }

  private calculateBackoff(attempt: number): Date {
    const baseSeconds = parseInt(process.env.NOTIFICATION_RETRY_BASE_SECONDS || '10', 10);
    const maxSeconds = parseInt(process.env.NOTIFICATION_RETRY_MAX_SECONDS || '60', 10);
    const jitterMax = parseInt(process.env.NOTIFICATION_RETRY_JITTER_SECONDS || '5', 10);
    
    // Exponential: base * 2^(attempt-1)
    let delay = baseSeconds * Math.pow(2, attempt - 1);
    if (delay > maxSeconds) delay = maxSeconds;
    
    // Add Jitter
    const jitter = Math.floor(Math.random() * jitterMax);
    delay += jitter;
    
    return new Date(Date.now() + delay * 1000);
  }

  private renderText(templateId: string, variables: Record<string, unknown>): string {
    switch (templateId) {
      case 'payment.succeeded':
        return `Your payment of ${variables['amount']} ${variables['currency']} was successful. Reference: ${variables['paymentId']}`;
      case 'payment.failed':
        return `Your payment of ${variables['amount']} ${variables['currency']} failed. Reason: ${variables['reason']}`;
      default:
        return `Notification from Payment Gateway. Event: ${templateId}`;
    }
  }
}
