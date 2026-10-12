import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from './types';
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
