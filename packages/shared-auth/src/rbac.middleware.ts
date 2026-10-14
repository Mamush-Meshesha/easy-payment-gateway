import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const rawRoles = req.user.roles || (req.user as any).role;
    let userRoles: Array<{ role: string; merchantId?: string | null }> = [];

    if (Array.isArray(rawRoles)) {
      userRoles = rawRoles.map(r => typeof r === 'string' ? { role: r } : r).filter(Boolean);
    } else if (typeof rawRoles === 'string') {
      userRoles = [{ role: rawRoles, merchantId: (req.user as any).merchantId }];
    }

    // Check if user is SUPER_ADMIN or ADMIN (Bypass all other checks)
    const isSuperAdmin = userRoles.some(r => r && (r.role === 'SUPER_ADMIN' || r.role === 'ADMIN'));
    if (isSuperAdmin) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = userRoles.some(r => r && allowedRoles.includes(r.role));
    if (!hasAllowedRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Check Tenant Isolation (merchantId scope)
    // If the route expects a specific merchantId in params, verify the role is scoped to it.
    const targetMerchantId = req.params?.merchantId || req.params?.id || req.body?.merchantId || (req.query?.merchantId as string);
    
    if (targetMerchantId) {
      const hasMerchantAccess = userRoles.some(r => 
        r && allowedRoles.includes(r.role) && (!r.merchantId || r.merchantId === targetMerchantId)
      );
      
      if (!hasMerchantAccess) {
        return res.status(403).json({ error: 'Forbidden: Access denied to this merchant resource' });
      }
    }

    next();
  };
};
