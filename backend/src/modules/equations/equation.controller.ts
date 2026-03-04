import { Request, Response } from 'express';
import { EquationService } from './equation.service.js';
import { CreateEquationDto, UpdateEquationUserDto } from './equation.types.js';

const ERROR_GET_EQUATIONS = 'Error al obtener ecuaciones';
const ERROR_EQUATION_NOT_FOUND = 'Ecuación no encontrada';
const ERROR_GET_EQUATION = 'Error al obtener la ecuación';
const ERROR_CREATE_EQUATION = 'Error al crear la ecuación';
const ERROR_UPDATE_EQUATION = 'Error al actualizar la ecuación';
const ERROR_DELETE_EQUATION = 'Error al eliminar la ecuación';
const ERROR_GET_FOR_UPLOAD = 'Error al obtener ecuaciones para subir';
const ERROR_UPLOAD_EQUATIONS = 'Error al subir ecuaciones';
const PERMISSION_ERROR_KEYWORD = 'permisos';

export class EquationController {
  constructor(private equationService: EquationService) {}

  getPublicEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 9));
      const result = await this.equationService.getPublicEquations(page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || ERROR_GET_EQUATIONS,
      });
    }
  };

  getAllEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 9));
      const result = await this.equationService.getAllEquations(userId, page, limit);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || ERROR_GET_EQUATIONS,
      });
    }
  };

  getForUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const result = await this.equationService.getEquationsForUpload(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || ERROR_GET_FOR_UPLOAD,
      });
    }
  };

  uploadEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const userEquationIds = Array.isArray(req.body?.userEquationIds)
        ? (req.body.userEquationIds as string[]).filter((id): id is string => typeof id === 'string')
        : [];
      await this.equationService.uploadEquations(userId, userEquationIds);
      res.status(200).json({ ok: true });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || ERROR_UPLOAD_EQUATIONS,
      });
    }
  };

  getEquationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const equation = await this.equationService.getEquationById(id);

      if (!equation) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }

      res.status(200).json(equation);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || ERROR_GET_EQUATION,
      });
    }
  };

  createEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const data: CreateEquationDto = {
        expression: req.body.equation,
        userId,
      };

      const equation = await this.equationService.createEquation(data);
      res.status(201).json(equation);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || ERROR_CREATE_EQUATION,
      });
    }
  };

  updateEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const data: UpdateEquationUserDto = req.body;

      const equation = await this.equationService.updateEquation(id, data, userId);
      res.status(200).json(equation);
    } catch (error: any) {
      res.status(error.message.includes(PERMISSION_ERROR_KEYWORD) ? 403 : 400).json({
        error: error.message || ERROR_UPDATE_EQUATION,
      });
    }
  };

  deleteEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      await this.equationService.deleteEquation(id, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.message.includes(PERMISSION_ERROR_KEYWORD) ? 403 : 400).json({
        error: error.message || ERROR_DELETE_EQUATION,
      });
    }
  };
}
