import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async registerInitialAdmin(req: Request, res: Response) {
    try {
      const user = await AuthService.registerInitialAdmin(req.body);
      res.status(201).json({ message: 'SUPER_ADMIN created successfully', userId: user.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async registerMerchant(req: Request, res: Response) {
    try {
      const result = await AuthService.registerMerchant(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}
