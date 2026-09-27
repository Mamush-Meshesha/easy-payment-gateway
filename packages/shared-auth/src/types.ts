export interface RoleScope {
  role: string;
  merchantId?: string | null;
}

export interface JwtPayload {
  userId: string;
  roles: RoleScope[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
