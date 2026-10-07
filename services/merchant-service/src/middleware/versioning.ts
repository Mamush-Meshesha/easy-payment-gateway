import { Request, Response, NextFunction } from 'express';

export const LATEST_API_VERSION = '2026-10-07';

export const SUPPORTED_VERSIONS = [
  '2026-01-01',
  '2026-06-15',
  '2026-10-07' // Latest
];

/**
 * Middleware to intercept the Api-Version header and attach it to the request.
 * If no version is provided, it defaults to the latest version.
 * If an unsupported version is provided, it returns a 400 Bad Request.
 */
export const apiVersioningMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const versionHeader = req.headers['api-version'] as string;
  
  if (!versionHeader) {
    req.apiVersion = LATEST_API_VERSION;
    return next();
  }

  if (!SUPPORTED_VERSIONS.includes(versionHeader)) {
    return res.status(400).json({
      error: 'unsupported_api_version',
      message: `The Api-Version '${versionHeader}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
    });
  }

  req.apiVersion = versionHeader;
  next();
};

/**
 * Base abstract class for defining structural up/down conversions between API versions.
 */
export abstract class ApiTransformer {
  abstract sourceVersion: string;
  abstract targetVersion: string;

  /**
   * Upgrades the payload from sourceVersion to targetVersion
   */
  abstract up(payload: any): any;

  /**
   * Downgrades the payload from targetVersion to sourceVersion
   */
  abstract down(payload: any): any;
}
