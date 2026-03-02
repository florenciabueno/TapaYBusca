import { EquationRepository } from './equation.repository.js';
import {
  CreateEquationDto,
  UpdateEquationUserDto,
  EquationResponse,
  EquationOrigin,
  EquationStatus,
  UserEquationRow,
  DefaultEquationRow,
} from './equation.types.js';

const STEPS_DEFAULT = 0;

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId: string): Promise<EquationResponse[]> {
    const userEquations = await this.equationRepository.findAllForUser(userId);
    return userEquations.map((eu) => this.toEquationResponse(eu));
  }

  async getEquationById(userEquationId: string): Promise<EquationResponse | null> {
    const userEquation = await this.equationRepository.findById(userEquationId);
    if (!userEquation) return null;
    return this.toEquationResponse(userEquation);
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const equationUser = await this.equationRepository.create(data);
    return this.toEquationResponse(equationUser);
  }

  async updateEquation(equationUserId: string, data: UpdateEquationUserDto, userId: string): Promise<EquationResponse> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) {
      throw new Error('No tienes permisos para modificar esta ecuación');
    }
    const equationUser = await this.equationRepository.update(equationUserId, data);
    return this.toEquationResponse(equationUser);
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
    return defaultEquations.map((eq) => this.toEquationResponseFromDefault(eq));
  }

  private toEquationResponse(row: UserEquationRow): EquationResponse {
    return {
      id: row.id,
      equation: this.getDisplayExpression(row.equation),
      origin: row.origin as EquationOrigin,
      status: row.status as EquationStatus,
      steps: STEPS_DEFAULT,
      date: this.formatDate(row.updatedAt),
      isActive: row.isActive,
    };
  }

  private toEquationResponseFromDefault(eq: DefaultEquationRow): EquationResponse {
    return {
      id: eq.id,
      equation: this.getDisplayExpression(eq),
      origin: EquationOrigin.DEFAULT,
      status: EquationStatus.NOT_STARTED,
      steps: STEPS_DEFAULT,
      date: this.formatDate(eq.createdAt),
      isActive: true,
    };
  }

  private getDisplayExpression(equation: {
    latexExpression?: string | null;
    infixExpression?: string | null;
    postfixExpression?: string | null;
  }): string {
    return equation.latexExpression || equation.infixExpression || equation.postfixExpression || '';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
