import { Request, Response } from 'express';
import { MerchantService } from '../services/merchant.service';
import { ApiKeyService } from '../services/apikey.service';
import { WebhookService } from '../services/webhook.service';

export class MerchantController {
  static async createMerchant(req: Request, res: Response) {
    try {
      const merchant = await MerchantService.createMerchant(req.body);
      res.status(201).json(merchant);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getMerchant(req: Request, res: Response) {
    try {
      const merchant = await MerchantService.getMerchant(req.params.merchantId as string);
      if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
      res.status(200).json(merchant);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getApiKeys(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) return res.status(403).json({ error: 'Merchant context required' });
      
      const keysArray = await ApiKeyService.listKeys(merchantId);
      res.status(200).json(keysArray);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getWebhooks(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const merchantId = user?.roles?.find((r: any) => r.merchantId)?.merchantId;
      if (!merchantId) return res.status(403).json({ error: 'Merchant context required' });
      
      const configs = await WebhookService.listWebhooks(merchantId);
      res.status(200).json(configs);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async generateApiKey(req: Request, res: Response) {
    try {
      const apiKey = await ApiKeyService.generateKey(req.params.merchantId as string, req.body);
      res.status(201).json(apiKey);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async revokeApiKey(req: Request, res: Response) {
    try {
      await ApiKeyService.revokeKey(req.params.keyId as string, req.params.merchantId as string);
      res.status(200).json({ message: 'Key revoked' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async configureWebhook(req: Request, res: Response) {
    try {
      const config = await WebhookService.createWebhookConfig(req.params.merchantId as string, req.body);
      res.status(201).json(config);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getPreferences(req: Request, res: Response) {
    try {
      const prefs = await MerchantService.getPreferences(req.params.merchantId as string);
      res.status(200).json(prefs);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updatePreferences(req: Request, res: Response) {
    try {
      const prefs = await MerchantService.updatePreferences(req.params.merchantId as string, req.body);
      res.status(200).json(prefs);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const methods = await MerchantService.getPaymentMethods(req.params.merchantId as string);
      res.status(200).json(methods);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async togglePaymentMethod(req: Request, res: Response) {
    try {
      const { isEnabled } = req.body;
      const method = await MerchantService.togglePaymentMethod(
        req.params.merchantId as string, 
        req.params.methodCode as string, 
        Boolean(isEnabled)
      );
      res.status(200).json(method);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
