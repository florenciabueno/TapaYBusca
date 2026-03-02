import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginCredentials, RegisterCredentials } from './auth.types.js';

const ERROR_AUTH = 'Error en autenticación';
const ERROR_REGISTER = 'Error en el registro';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await this.authService.login(credentials);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || ERROR_AUTH,
      });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: RegisterCredentials = req.body;
      const result = await this.authService.register(credentials);

      res.status(201).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || ERROR_REGISTER,
      });
    }
  };
}
