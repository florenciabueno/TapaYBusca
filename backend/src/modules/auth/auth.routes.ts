import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { EquationRepository } from '../equations/equation.repository.js';
import { EmailService } from '../../shared/services/email/email.service.js';
import { PasswordResetController } from './password-reset/passwordReset.controller.js';
import { PasswordResetRepository } from './password-reset/passwordReset.repository.js';
import { PasswordResetService } from './password-reset/passwordReset.service.js';

const router = Router();
const authRepository = new AuthRepository();
const equationRepository = new EquationRepository();
const authService = new AuthService(authRepository, equationRepository);
const authController = new AuthController(authService);

const passwordResetRepository = new PasswordResetRepository();
const emailService = new EmailService();
const passwordResetService = new PasswordResetService(passwordResetRepository, emailService);
const passwordResetController = new PasswordResetController(passwordResetService);

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
});

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/forgot-password', forgotPasswordLimiter, passwordResetController.forgotPassword);
router.post('/reset-password', passwordResetController.resetPassword);

export default router;
