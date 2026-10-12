import { JwtPayload } from './types';
export declare const generateAccessToken: (payload: JwtPayload) => string;
export declare const verifyToken: (token: string) => JwtPayload;
