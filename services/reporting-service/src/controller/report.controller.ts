import { Request, Response, NextFunction } from 'express';
import prisma from '../dal/prisma';
import { logger } from '../utils/logger';
import { Parser } from 'json2csv';

/**
 * ReportController provides HTTP endpoints for merchant reporting.
 *
 * AUTHORIZATION: Every handler MUST verify that the authenticated merchant_id
 * matches the requested resource. Data is read from this service's own
 * projection database — NOT from other service databases.
 *
 * The merchant_id is taken from the JWT (req.user.merchantId) — NOT from query params.
 */
export class ReportController {
  /**
   * GET /api/v1/reports/payments
   * Returns a paginated list of payment projections for the authenticated merchant.
   */
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized: merchant context required' });
        return;
      }

      const { status, currency, after, limit } = req.query;
      const take = Math.min(parseInt(limit as string, 10) || 25, 100);

      const where: any = { merchantId };
      if (status) where.status = status as string;
      if (currency) where.currency = currency as string;
      if (after) where.paymentId = { gt: after as string };

      const payments = await prisma.paymentProjection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
      });

      const hasMore = payments.length > take;
      const results = hasMore ? payments.slice(0, take) : payments;
      const nextCursor = hasMore ? results[results.length - 1].paymentId : null;

      res.json({
        data: results.map((p) => ({
          paymentId: p.paymentId,
          merchantReference: p.merchantReference,
          status: p.status,
          amount: p.amount.toString(), // BigInt → string to avoid JSON loss
          currency: p.currency,
          createdAt: p.createdAt,
          lastEventAt: p.lastEventAt,
        })),
        pagination: { hasMore, nextCursor },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/payments/export.csv
   * Returns a CSV export of payment projections for the authenticated merchant.
   */
  async exportPaymentsCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) {
        res.status(401).json({ error: 'Unauthorized: merchant context required' });
        return;
      }

      const payments = await prisma.paymentProjection.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: 10000, // Hard ceiling — batch jobs should use streaming
      });

      const fields = ['paymentId', 'merchantReference', 'status', 'amount', 'currency', 'createdAt'];
      const parser = new Parser({ fields });
      const csv = parser.parse(
        payments.map((p) => ({
          paymentId: p.paymentId,
          merchantReference: p.merchantReference,
          status: p.status,
          amount: p.amount.toString(),
          currency: p.currency,
          createdAt: p.createdAt.toISOString(),
        }))
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payments-${merchantId}-${Date.now()}.csv"`);
      res.send(csv);

      logger.info('Payment CSV exported', { merchantId, count: payments.length });
    } catch (err) {
      next(err);
    }
  }
}
