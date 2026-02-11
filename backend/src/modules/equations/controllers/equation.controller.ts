import { Request, Response } from 'express';
import { EquationService } from '../services/equation.service.js';
import { CreateEquationDto, UpdateEquationDto } from '../types/equation.types.js';

export class EquationController {
  constructor(private equationService: EquationService) {}

  getAllEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const equations = await this.equationService.getAllEquations(userId);
      
      res.status(200).json(equations);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Error al obtener ecuaciones',
      });
    }
  }

  getEquationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const equation = await this.equationService.getEquationById(id);
      
      if (!equation) {
        res.status(404).json({ error: 'Ecuación no encontrada' });
        return;
      }

      res.status(200).json(equation);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Error al obtener la ecuación',
      });
    }
  }

  createEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const data: CreateEquationDto = {
        ...req.body,
        userId
      };
      
      const equation = await this.equationService.createEquation(data);
      res.status(201).json(equation);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Error al crear la ecuación',
      });
    }
  }

  updateEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const data: UpdateEquationDto = req.body;
      
      const equation = await this.equationService.updateEquation(id, data, userId);
      res.status(200).json(equation);
    } catch (error: any) {
      res.status(error.message.includes('permisos') ? 403 : 400).json({
        error: error.message || 'Error al actualizar la ecuación',
      });
    }
  }

  deleteEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      await this.equationService.deleteEquation(id, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.message.includes('permisos') ? 403 : 400).json({
        error: error.message || 'Error al eliminar la ecuación',
      });
    }
  }
}
