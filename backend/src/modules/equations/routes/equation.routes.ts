import { Router } from 'express';
import { EquationController } from '../controllers/equation.controller.js';
import { EquationService } from '../services/equation.service.js';
import { EquationRepository } from '../repositories/equation.repository.js';

const router = Router();
const equationRepository = new EquationRepository();
const equationService = new EquationService(equationRepository);
const equationController = new EquationController(equationService);

router.get('/', equationController.getAllEquations.bind(equationController));
router.get('/:id', equationController.getEquationById.bind(equationController));
router.post('/', equationController.createEquation.bind(equationController));
router.put('/:id', equationController.updateEquation.bind(equationController));
router.delete('/:id', equationController.deleteEquation.bind(equationController));

export default router;
