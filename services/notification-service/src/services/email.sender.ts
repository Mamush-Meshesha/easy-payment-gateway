import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class RetryableError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export class EmailSender {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.warn('SMTP configuration incomplete: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are required. Email sending is disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.transporter) {
      console.warn('Email sending skipped (no SMTP config):', payload.to, payload.subject);
      return;
    }

    const fromAddress = process.env.SMTP_FROM || 'no-reply@paymentgateway.local';

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      logger.info('Email sent', { to: payload.to, subject: payload.subject });
    } catch (err: any) {
      // Classify error based on nodemailer error codes or SMTP responses
      const errCode = err.code || '';
      const errCommand = err.command || '';
      const errResponseCode = err.responseCode || 0;

      // Typically retryable: connection issues, timeouts, temporary SMTP 4xx codes
      const isRetryable =
        ['ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ESOCKET', 'EENVELOPE'].includes(errCode) ||
        (errResponseCode >= 400 && errResponseCode < 500) ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('timeout');

      if (isRetryable) {
        throw new RetryableError(`Retryable email failure: ${err.message}`, errCode);
      } else {
        throw new NonRetryableError(`Non-retryable email failure: ${err.message}`, errCode);
      }
    }
  }
}
