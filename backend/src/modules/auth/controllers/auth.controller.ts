import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { LoginCredentials } from '../types/auth.types.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await this.authService.login(credentials);
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || 'Error en autenticación',
      });
    }
  }
}
