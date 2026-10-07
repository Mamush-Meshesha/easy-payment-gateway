import { Request, Response, NextFunction } from 'express';
import { LATEST_API_VERSION, SUPPORTED_VERSIONS } from './versioning';

// A mock mapping of transformers. In a real system, these would be robust class instances.
// We map versions to their structural down-conversion rules.
const downTransformers: Record<string, (payload: any) => any> = {
  '2026-01-01': (payload) => {
    // Structural downgrade for 2026-01-01
    if (payload && Array.isArray(payload.data)) {
      payload.data = payload.data.map((item: any) => ({
        ...item,
        // E.g., downgrade 'createdAt' string to a timestamp number
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : undefined,
        // Remove newer fields
        _v: undefined 
      }));
    }
    return payload;
  },
  '2026-06-15': (payload) => {
    // Structural downgrade for 2026-06-15
    return payload;
  }
};

const upTransformers: Record<string, (payload: any) => any> = {
  '2026-01-01': (payload) => {
    // Structural upgrade: If they sent an old payload, upconvert it to LATEST so our controllers work.
    if (payload && payload.timestamp) {
      payload.createdAt = new Date(payload.timestamp).toISOString();
      delete payload.timestamp;
    }
    return payload;
  },
  '2026-06-15': (payload) => {
    return payload;
  }
};

/**
 * Middleware that intercepts requests and responses to apply structural
 * API version transformations.
 */
export const apiTransformerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const version = req.apiVersion || LATEST_API_VERSION;

  if (version === LATEST_API_VERSION) {
    return next();
  }

  // 1. UP-CONVERT incoming request payload
  if (req.body && Object.keys(req.body).length > 0) {
    const upConvert = upTransformers[version];
    if (upConvert) {
      try {
        req.body = upConvert(req.body);
      } catch (err) {
        return res.status(400).json({ error: 'payload_upgrade_failed', message: 'Failed to parse legacy payload format.' });
      }
    }
  }

  // 2. DOWN-CONVERT outgoing response payload
  const originalJson = res.json.bind(res);
  
  res.json = (body: any) => {
    const downConvert = downTransformers[version];
    if (downConvert) {
      try {
        body = downConvert(body);
      } catch (err) {
        console.error('Failed to down-convert response payload', err);
      }
    }
    return originalJson(body);
  };

  next();
};
