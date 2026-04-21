import { Router } from 'express';
import { EquationController } from './equation.controller.js';
import { EquationService } from './equation.service.js';
import { ResolutionService } from './resolution.service.js';
import { EquationRepository } from './equation.repository.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { GuestResolutionService } from './guest-resolution.service.js';

const router = Router();
const equationRepository = new EquationRepository();
const equationService = new EquationService(equationRepository);
const resolutionService = new ResolutionService(equationRepository);
const guestResolutionService = new GuestResolutionService(equationRepository);
const equationController = new EquationController(
  equationService,
  resolutionService,
  guestResolutionService
);

router.get('/public', equationController.getPublicEquations.bind(equationController));
router.get('/guest/:id', equationController.getGuestEquationById.bind(equationController));
router.post('/guest/:id/resolve', equationController.guestResolveStep.bind(equationController));
router.get('/guest/:id/resolution', equationController.guestGetResolution.bind(equationController));
router.post('/guest/:id/reset-resolution', equationController.guestResetResolution.bind(equationController));
router.post('/guest/:id/finish-resolution', equationController.guestFinishResolution.bind(equationController));

router.get('/', authMiddleware, equationController.getAllEquations.bind(equationController));
router.get('/for-upload', authMiddleware, equationController.getForUpload.bind(equationController));
router.post('/upload', authMiddleware, equationController.uploadEquations.bind(equationController));
router.post('/download', authMiddleware, equationController.downloadEquations.bind(equationController));
router.post('/:id/resolve', authMiddleware, equationController.resolveStep.bind(equationController));
router.get('/:id/resolution', authMiddleware, equationController.getResolution.bind(equationController));
router.post('/:id/reset-resolution', authMiddleware, equationController.resetResolution.bind(equationController));
router.post('/:id/finish-resolution', authMiddleware, equationController.finishResolution.bind(equationController));
router.get('/:id', authMiddleware, equationController.getEquationById.bind(equationController));
router.post('/', authMiddleware, equationController.createEquation.bind(equationController));
router.put('/:id', authMiddleware, equationController.updateEquation.bind(equationController));
router.delete('/:id', authMiddleware, equationController.deleteEquation.bind(equationController));

export default router;
