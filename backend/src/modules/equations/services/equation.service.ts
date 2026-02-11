import { EquationRepository } from '../repositories/equation.repository.js';
import { CreateEquationDto, UpdateEquationDto, EquationResponse } from '../types/equation.types.js';

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId?: string): Promise<EquationResponse[]> {
    const equations = await this.equationRepository.findAll(userId);
    
    return equations.map(eq => ({
      id: eq.id,
      equation: eq.equation,
      origin: this.formatOrigin(eq.origin),
      status: this.formatStatus(eq.status),
      steps: eq.steps,
      date: this.formatDate(eq.updatedAt)
    }));
  }

  async getEquationById(id: string): Promise<EquationResponse | null> {
    const equation = await this.equationRepository.findById(id);
    
    if (!equation) return null;

    return {
      id: equation.id,
      equation: equation.equation,
      origin: this.formatOrigin(equation.origin),
      status: this.formatStatus(equation.status),
      steps: equation.steps,
      date: this.formatDate(equation.updatedAt)
    };
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const equation = await this.equationRepository.create(data);
    
    return {
      id: equation.id,
      equation: equation.equation,
      origin: this.formatOrigin(equation.origin),
      status: this.formatStatus(equation.status),
      steps: equation.steps,
      date: this.formatDate(equation.updatedAt)
    };
  }

  async updateEquation(id: string, data: UpdateEquationDto, userId?: string): Promise<EquationResponse> {
    if (userId) {
      const canModify = await this.equationRepository.canUserModify(id, userId);
      if (!canModify) {
        throw new Error('No tienes permisos para modificar esta ecuación');
      }
    }

    const equation = await this.equationRepository.update(id, data);
    
    return {
      id: equation.id,
      equation: equation.equation,
      origin: this.formatOrigin(equation.origin),
      status: this.formatStatus(equation.status),
      steps: equation.steps,
      date: this.formatDate(equation.updatedAt)
    };
  }

  async deleteEquation(id: string, userId?: string): Promise<void> {
    if (userId) {
      const canModify = await this.equationRepository.canUserModify(id, userId);
      if (!canModify) {
        throw new Error('No tienes permisos para eliminar esta ecuación');
      }
    }

    await this.equationRepository.delete(id);
  }

  private formatOrigin(origin: string): string {
    const originMap: Record<string, string> = {
      'MANUAL': 'manual',
      'IMPORTADO': 'importado',
      'DESCARGADO': 'descargado',
      'DEFECTO': 'defecto'
    };
    return originMap[origin] || origin;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'SIN_COMENZAR': 'sin comenzar',
      'EN_PROCESO': 'en proceso',
      'RESUELTA': 'resuelta'
    };
    return statusMap[status] || status;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
