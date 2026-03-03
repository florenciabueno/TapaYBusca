import { Request, Response } from 'express';
import { PasswordResetService } from './passwordReset.service.js';
import type { ForgotPasswordBody, ResetPasswordBody } from './passwordReset.types.js';
import { validateForgotPasswordBody, validateResetPasswordBody } from './passwordReset.validators.js';

const FORGOT_PASSWORD_ERROR_MESSAGE = 'Error al solicitar restablecimiento de contraseña';
const RESET_PASSWORD_ERROR_MESSAGE = 'Error al restablecer contraseña';

export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const body: ForgotPasswordBody = req.body;
      validateForgotPasswordBody(body);

      const result = await this.passwordResetService.requestPasswordReset(body.email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || FORGOT_PASSWORD_ERROR_MESSAGE,
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const body: ResetPasswordBody = req.body;
      validateResetPasswordBody(body);

      const result = await this.passwordResetService.resetPassword(body.token, body.newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error instanceof Error ? 400 : 500).json({
        error: error.message || RESET_PASSWORD_ERROR_MESSAGE,
      });
    }
  };
}

