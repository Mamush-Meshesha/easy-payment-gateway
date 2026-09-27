import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const userRoles = req.user.roles;
    
    // Check if user is SUPER_ADMIN (Bypass all other checks)
    const isSuperAdmin = userRoles.some(r => r.role === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = userRoles.some(r => allowedRoles.includes(r.role));
    if (!hasAllowedRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Check Tenant Isolation (merchantId scope)
    // If the route expects a specific merchantId in params, verify the role is scoped to it.
    const targetMerchantId = req.params?.merchantId || req.body?.merchantId;
    
    if (targetMerchantId) {
      const hasMerchantAccess = userRoles.some(r => 
        allowedRoles.includes(r.role) && r.merchantId === targetMerchantId
      );
      
      if (!hasMerchantAccess) {
        return res.status(403).json({ error: 'Forbidden: Access denied to this merchant resource' });
      }
    }

    next();
  };
};
