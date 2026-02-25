import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types.js';
import { UpdateProfileDto } from '../types/profile.types.js';

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

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: RegisterCredentials = req.body;
      const result = await this.authService.register(credentials);
      
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || 'Error en el registro',
      });
    }
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const profile = await this.authService.getProfile(userId);
      
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(error instanceof Error ? 404 : 500).json({
        error: error.message || 'Error al obtener el perfil',
      });
    }
  }

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const data: UpdateProfileDto = req.body;
      const profile = await this.authService.updateProfile(userId, data);
      
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || 'Error al actualizar el perfil',
      });
    }
  }
}
