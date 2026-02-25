import { EquationRepository } from '../repositories/equation.repository.js';
import { CreateEquationDto, UpdateEquationUserDto, EquationResponse } from '../types/equation.types.js';

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId: string): Promise<EquationResponse[]> {
    const userEquations = await this.equationRepository.findAllForUser(userId);
    
    return userEquations.map(eu => ({
      id: eu.id,
      equation: eu.equation.infixExpression || eu.equation.postfixExpression,
      origin: this.formatOrigin(eu.origin),
      status: this.formatStatus(eu.status),
      steps: 0,
      date: this.formatDate(eu.updatedAt),
      isActive: eu.isActive,
    }));
  }

  async getEquationById(userEquationId: string): Promise<EquationResponse | null> {
    const userEquation = await this.equationRepository.findById(userEquationId);
    
    if (!userEquation) return null;

    return {
      id: userEquation.id,
      equation: userEquation.equation.infixExpression || userEquation.equation.postfixExpression,
      origin: this.formatOrigin(userEquation.origin),
      status: this.formatStatus(userEquation.status),
      steps: 0,
      date: this.formatDate(userEquation.updatedAt),
      isActive: userEquation.isActive,
    };
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const equationUser = await this.equationRepository.create(data);
    
    return {
      id: equationUser.id,
      equation: equationUser.equation.infixExpression || equationUser.equation.postfixExpression,
      origin: this.formatOrigin(equationUser.origin),
      status: this.formatStatus(equationUser.status),
      steps: 0,
      date: this.formatDate(equationUser.updatedAt),
      isActive: equationUser.isActive,
    };
  }

  async updateEquation(equationUserId: string, data: UpdateEquationUserDto, userId: string): Promise<EquationResponse> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para modificar esta ecuación');
    }

    const equationUser = await this.equationRepository.update(equationUserId, data);
    
    return {
      id: equationUser.id,
      equation: equationUser.equation.infixExpression || equationUser.equation.postfixExpression,
      origin: this.formatOrigin(equationUser.origin),
      status: this.formatStatus(equationUser.status),
      steps: 0,
      date: this.formatDate(equationUser.updatedAt),
      isActive: equationUser.isActive,
    };
  }

  async deleteEquation(equationUserId: string, userId: string): Promise<void> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para eliminar esta ecuación');
    }

    await this.equationRepository.softDelete(equationUserId);
  }

  async getPublicEquations(): Promise<EquationResponse[]> {
    const defaultEquations = await this.equationRepository.findDefaultEquations();
    
    return defaultEquations.map(eq => ({
      id: eq.id,
      equation: eq.infixExpression || eq.postfixExpression,
      origin: 'defecto',
      status: 'sin comenzar',
      steps: 0,
      date: this.formatDate(eq.createdAt),
      isActive: true,
    }));
  }

  private formatOrigin(origin: string): string {
    const originMap: Record<string, string> = {
      'DEFAULT': 'defecto',
      'CREATED': 'creada',
      'DOWNLOADED': 'descargado',
    };
    return originMap[origin] || origin.toLowerCase();
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'NOT_STARTED': 'sin comenzar',
      'IN_PROGRESS': 'en proceso',
      'SOLVED': 'resuelta'
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
