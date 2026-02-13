import { EquationRepository } from '../repositories/equation.repository.js';
import { CreateEquationDto, UpdateEquationUserDto, EquationResponse } from '../types/equation.types.js';

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId: string): Promise<EquationResponse[]> {
    const ecuacionesUsuario = await this.equationRepository.findAllForUser(userId);
    
    return ecuacionesUsuario.map(eu => ({
      id: eu.id,
      equation: eu.ecuacion.expresionPostfija,
      origin: this.formatOrigin(eu.origen),
      status: this.formatStatus(eu.estado),
      steps: 0, // Por ahora retornamos 0, se calculará después con la tabla RESOLUCION
      date: this.formatDate(eu.updatedAt),
      activa: eu.activa,
    }));
  }

  async getEquationById(ecuacionUsuarioId: string): Promise<EquationResponse | null> {
    const ecuacionUsuario = await this.equationRepository.findById(ecuacionUsuarioId);
    
    if (!ecuacionUsuario) return null;

    return {
      id: ecuacionUsuario.id,
      equation: ecuacionUsuario.ecuacion.expresionPostfija,
      origin: this.formatOrigin(ecuacionUsuario.origen),
      status: this.formatStatus(ecuacionUsuario.estado),
      steps: 0,
      date: this.formatDate(ecuacionUsuario.updatedAt),
      activa: ecuacionUsuario.activa,
    };
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const ecuacionUsuario = await this.equationRepository.create(data);
    
    return {
      id: ecuacionUsuario.id,
      equation: ecuacionUsuario.ecuacion.expresionPostfija,
      origin: this.formatOrigin(ecuacionUsuario.origen),
      status: this.formatStatus(ecuacionUsuario.estado),
      steps: 0,
      date: this.formatDate(ecuacionUsuario.updatedAt),
      activa: ecuacionUsuario.activa,
    };
  }

  async updateEquation(ecuacionUsuarioId: string, data: UpdateEquationUserDto, userId: string): Promise<EquationResponse> {
    const canModify = await this.equationRepository.canUserModify(ecuacionUsuarioId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para modificar esta ecuación');
    }

    const ecuacionUsuario = await this.equationRepository.update(ecuacionUsuarioId, data);
    
    return {
      id: ecuacionUsuario.id,
      equation: ecuacionUsuario.ecuacion.expresionPostfija,
      origin: this.formatOrigin(ecuacionUsuario.origen),
      status: this.formatStatus(ecuacionUsuario.estado),
      steps: 0,
      date: this.formatDate(ecuacionUsuario.updatedAt),
      activa: ecuacionUsuario.activa,
    };
  }

  async deleteEquation(ecuacionUsuarioId: string, userId: string): Promise<void> {
    const canModify = await this.equationRepository.canUserModify(ecuacionUsuarioId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para eliminar esta ecuación');
    }

    await this.equationRepository.softDelete(ecuacionUsuarioId);
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
