import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { merchantClient } from '../services/merchant.client';
import { serializeRequestContext } from 'ts-grpc-auth';
import * as grpc from '@grpc/grpc-js';
import { prisma } from '../dal/prisma';
import * as net from 'net';

async function checkTcp(host: string, port: number): Promise<{ status: string, latency: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ status: 'ok', latency });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'down', latency: 0 });
    });
    socket.on('error', () => {
      socket.destroy();
      resolve({ status: 'down', latency: 0 });
    });
    
    socket.connect(port, host);
  });
}

function buildMetadata(user: any): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const context = {
    subjectId: user?.id || 'system',
    merchantId: '',
    roles: user?.roles?.map((r: any) => r.role) || [],
    permissions: [],
    sessionId: '',
    authType: 'jwt',
    callerService: 'admin-service',
    contextVersion: 1,
    environment: 'LIVE'
  };
  metadata.add('x-request-context', serializeRequestContext(context));
  return metadata;
}

export class AdminController {
  async listMerchants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const metadata = buildMetadata(user);
      
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      merchantClient.ListMerchants({ limit, offset }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC ListMerchants error', { error: err.message });
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json(response);
      });
    } catch (err) {
      next(err);
    }
  }

  async getMerchantDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const metadata = buildMetadata(user);
      const merchantId = req.params.id;

      merchantClient.GetMerchant({ merchant_id: merchantId }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC GetMerchant error', { error: err.message });
          if (err.code === grpc.status.NOT_FOUND) {
            res.status(404).json({ error: 'Merchant not found' });
            return;
          }
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json(response);
      });
    } catch (err) {
      next(err);
    }
  }

  async suspendMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const metadata = buildMetadata(user);
      const merchantId = req.params.id;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ error: 'Reason is required' });
        return;
      }

      merchantClient.SuspendMerchant({ merchant_id: merchantId, reason }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC SuspendMerchant error', { error: err.message });
          if (err.code === grpc.status.NOT_FOUND) {
            res.status(404).json({ error: 'Merchant not found' });
            return;
          }
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json(response);
      });
    } catch (err) {
      next(err);
    }
  }

  async approveMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const metadata = buildMetadata(user);
      const merchantId = req.params.id;

      merchantClient.ApproveMerchant({ merchant_id: merchantId }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC ApproveMerchant error', { error: err.message });
          if (err.code === grpc.status.NOT_FOUND) {
            res.status(404).json({ error: 'Merchant not found' });
            return;
          }
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json(response);
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMerchantLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const metadata = buildMetadata(user);
      const merchantId = req.params.id;
      const { currency, minAmount, maxAmount } = req.body;

      if (!currency || minAmount === undefined || maxAmount === undefined) {
        res.status(400).json({ error: 'currency, minAmount, maxAmount are required' });
        return;
      }

      merchantClient.UpdateMerchantLimit({ merchant_id: merchantId, currency, min_amount: minAmount, max_amount: maxAmount }, metadata, (err: any, response: any) => {
        if (err) {
          logger.error('gRPC UpdateMerchantLimit error', { error: err.message });
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json(response);
      });
    } catch (err) {
      next(err);
    }
  }

  async systemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pgStart = Date.now();
      let pgStatus = 'down';
      try {
        await prisma.$queryRawUnsafe('SELECT 1');
        pgStatus = 'ok';
      } catch (e) { console.error('PG health check failed', e); }
      const pgLatency = Date.now() - pgStart;

      const endpoints = [
        { name: 'Redis Cache (In-Memory)', host: 'localhost', port: 6379, type: 'infra' },
        { name: 'Kafka Event Bus', host: 'localhost', port: 9092, type: 'infra' },
        { name: 'Auth Identity Provider', host: 'localhost', port: 3001, type: 'service' },
        { name: 'Merchant API Gateway', host: 'localhost', port: 3002, type: 'service' },
        { name: 'Ledger Service (Go)', host: 'localhost', port: 8085, type: 'service' },
        { name: 'Risk Service (Go)', host: 'localhost', port: 8086, type: 'service' },
        { name: 'Provider Service (Go)', host: 'localhost', port: 8087, type: 'service' },
        { name: 'Webhook Service (Go)', host: 'localhost', port: 50056, type: 'service' }, // gRPC only
        { name: 'Reconciliation Service (Go)', host: 'localhost', port: 3015, type: 'service' },
        { name: 'Payment Service (Go)', host: 'localhost', port: 8084, type: 'service' },
        { name: 'Settlement Service (Go)', host: 'localhost', port: 3010, type: 'service' },
        { name: 'Billing Service (Go)', host: 'localhost', port: 3016, type: 'service' },
        { name: 'Dispute Service (Go)', host: 'localhost', port: 3017, type: 'service' },
        { name: 'Pricing Service (Go)', host: 'localhost', port: 50064, type: 'service' }, // gRPC only
        { name: 'Vault Service (Go)', host: 'localhost', port: 3019, type: 'service' },
        { name: 'Routing Service (Go)', host: 'localhost', port: 3020, type: 'service' },
        { name: 'FX Service (Go)', host: 'localhost', port: 3021, type: 'service' }
      ];

      const results = await Promise.all(
        endpoints.map(async (ep) => {
          const health = await checkTcp(ep.host, ep.port);
          return { name: ep.name, status: health.status, latency: health.latency };
        })
      );

      // Add worker services that don't bind to any ports
      results.push({ name: 'Transaction Worker (Go)', status: 'ok', latency: 0 });

      // Add postgres to the front
      results.unshift({ name: 'Primary Database (Postgres)', status: pgStatus, latency: pgLatency });

      res.json({
        status: 'ok',
        service: 'admin-service',
        timestamp: new Date().toISOString(),
        latency: 0,
        detailsArray: results
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Payment Providers Management ---

  async listProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await prisma.paymentProvider.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(providers);
    } catch (err) {
      next(err);
    }
  }

  async createProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, type, isActive, description, logoUrl } = req.body;
      if (!code || !name) {
        res.status(400).json({ error: 'code and name are required' });
        return;
      }
      
      const provider = await prisma.paymentProvider.create({
        data: {
          code: code.toUpperCase(),
          name,
          type: type || 'MOBILE_MONEY',
          isActive: isActive !== undefined ? isActive : true,
          description,
          logoUrl
        }
      });
      res.status(201).json(provider);
    } catch (err) {
      next(err);
    }
  }

  async updateProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, isActive, description, logoUrl } = req.body;
      
      const provider = await prisma.paymentProvider.update({
        where: { id },
        data: {
          name,
          isActive,
          description,
          logoUrl
        }
      });
      res.json(provider);
    } catch (err) {
      if ((err as any).code === 'P2025') {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }
      next(err);
    }
  }
}
