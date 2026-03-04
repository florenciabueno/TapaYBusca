import { Router } from 'express';
import { EquationController } from './equation.controller.js';
import { EquationService } from './equation.service.js';
import { EquationRepository } from './equation.repository.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const equationRepository = new EquationRepository();
const equationService = new EquationService(equationRepository);
const equationController = new EquationController(equationService);

// Endpoint público - ecuaciones por defecto (sin autenticación)
router.get('/public', equationController.getPublicEquations.bind(equationController));

// Endpoints protegidos - requieren autenticación
router.get('/', authMiddleware, equationController.getAllEquations.bind(equationController));
router.get('/for-upload', authMiddleware, equationController.getForUpload.bind(equationController));
router.post('/upload', authMiddleware, equationController.uploadEquations.bind(equationController));
router.get('/:id', authMiddleware, equationController.getEquationById.bind(equationController));
router.post('/', authMiddleware, equationController.createEquation.bind(equationController));
router.put('/:id', authMiddleware, equationController.updateEquation.bind(equationController));
router.delete('/:id', authMiddleware, equationController.deleteEquation.bind(equationController));

export default router;
