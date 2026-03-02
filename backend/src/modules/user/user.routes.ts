import { Router } from 'express';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/profile', authMiddleware, userController.getProfile.bind(userController));
router.put('/profile', authMiddleware, userController.updateProfile.bind(userController));

export default router;
