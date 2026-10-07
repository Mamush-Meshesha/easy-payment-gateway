import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    apiVersion?: string;
    merchantId?: string; // from auth middleware
  }
}
