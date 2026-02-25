import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { EquationRepository } from '../../equations/repositories/equation.repository.js';

const router = Router();
const authRepository = new AuthRepository();
const equationRepository = new EquationRepository();
const authService = new AuthService(authRepository, equationRepository);
const authController = new AuthController(authService);

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));

export default router;
