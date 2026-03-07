import { Request, Response } from 'express';
import { PasswordResetService } from './passwordReset.service.js';
import type { ForgotPasswordBody, ResetPasswordBody } from './passwordReset.types.js';

const FORGOT_PASSWORD_ERROR_MESSAGE = 'Error al solicitar restablecimiento de contraseña.';
const RESET_PASSWORD_ERROR_MESSAGE = 'Error al restablecer contraseña.';

export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as ForgotPasswordBody;
      const result = await this.passwordResetService.requestPasswordReset(body);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error instanceof Error ? error.message : FORGOT_PASSWORD_ERROR_MESSAGE,
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as ResetPasswordBody;
      const result = await this.passwordResetService.resetPassword(body);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error instanceof Error ? error.message : RESET_PASSWORD_ERROR_MESSAGE,
      });
    }
  };
}
