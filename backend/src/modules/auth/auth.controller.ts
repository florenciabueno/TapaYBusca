import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { getErrorMessage, parseLoginBody, parseRegisterBody } from './auth.controller.helpers.js';

const ERROR_AUTH = 'Error en autenticación';
const ERROR_REGISTER = 'Error en el registro';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials = parseLoginBody(req.body);
      const result = await this.authService.login(credentials);

      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: getErrorMessage(error, ERROR_AUTH),
      });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials = parseRegisterBody(req.body);
      const result = await this.authService.register(credentials);

      res.status(201).json(result);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: getErrorMessage(error, ERROR_REGISTER),
      });
    }
  };
}
