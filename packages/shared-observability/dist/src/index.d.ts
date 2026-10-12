import { Request, Response, NextFunction } from 'express';
export declare function initTracing(serviceName: string): any;
/**
 * Express Middleware to track request duration and status
 */
export declare function metricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Express Handler to expose /metrics for Prometheus to scrape
 */
export declare function metricsEndpoint(req: Request, res: Response): Promise<void>;
import winston from 'winston';
export declare function createStructuredLogger(serviceName: string): winston.Logger;
