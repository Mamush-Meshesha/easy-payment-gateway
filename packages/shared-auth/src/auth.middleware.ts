import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { JwtPayload } from './types';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
};
