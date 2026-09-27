import { Request, Response, NextFunction } from 'express';
import { standardErrorHandler } from '@payment-gateway/api-errors';
import { logger } from '../utils/logger';

/**
 * errorHandler delegates to the shared standardErrorHandler from @payment-gateway/api-errors.
 * This ensures all services emit the same canonical error format.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (!err?.statusCode || err.statusCode >= 500) {
    logger.error(`[ErrorHandler] ${err?.message ?? err}`, {
      stack: err?.stack,
      path: req.path,
      method: req.method,
    });
  }
  standardErrorHandler(err, req, res, next);
}
