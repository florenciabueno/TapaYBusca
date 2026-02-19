import { EquationRepository } from '../repositories/equation.repository.js';
import { CreateEquationDto, UpdateEquationUserDto, EquationResponse } from '../types/equation.types.js';

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId: string): Promise<EquationResponse[]> {
    const userEquations = await this.equationRepository.findAllForUser(userId);
    
    return userEquations.map(eu => ({
      id: eu.id,
      equation: eu.ecuacion.expresionPostfija,
      origin: this.formatOrigin(eu.origen),
      status: this.formatStatus(eu.estado),
      steps: 0, // Por ahora retornamos 0, se calculará después con la tabla RESOLUCION
      date: this.formatDate(eu.updatedAt),
      activa: eu.activa,
    }));
  }

  async getEquationById(userEquationId: string): Promise<EquationResponse | null> {
    const userEquation = await this.equationRepository.findById(userEquationId);
    
    if (!userEquation) return null;

    return {
      id: userEquation.id,
      equation: userEquation.ecuacion.expresionPostfija,
      origin: this.formatOrigin(userEquation.origen),
      status: this.formatStatus(userEquation.estado),
      steps: 0,
      date: this.formatDate(userEquation.updatedAt),
      activa: userEquation.activa,
    };
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const equationUser = await this.equationRepository.create(data);
    
    return {
      id: equationUser.id,
      equation: equationUser.ecuacion.expresionPostfija,
      origin: this.formatOrigin(equationUser.origen),
      status: this.formatStatus(equationUser.estado),
      steps: 0,
      date: this.formatDate(equationUser.updatedAt),
      activa: equationUser.activa,
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
      equation: equationUser.ecuacion.expresionPostfija,
      origin: this.formatOrigin(equationUser.origen),
      status: this.formatStatus(equationUser.estado),
      steps: 0,
      date: this.formatDate(equationUser.updatedAt),
      activa: equationUser.activa,
    };
  }

  async deleteEquation(equationUserId: string, userId: string): Promise<void> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para eliminar esta ecuación');
    }

    await this.equationRepository.softDelete(equationUserId);
  }

  private formatOrigin(origin: string): string {
    const originMap: Record<string, string> = {
      'POR_DEFECTO': 'defecto',
      'CREADA': 'creada',
      'DESCARGADA': 'descargado',
    };
    return originMap[origin] || origin.toLowerCase();
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
