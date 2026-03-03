import { EquationRepository } from './equation.repository.js';
import {
  CreateEquationDto,
  UpdateEquationUserDto,
  EquationResponse,
  EquationOrigin,
  EquationStatus,
  UserEquationRow,
  DefaultEquationRow,
  PaginatedEquationsResponse,
} from './equation.types.js';
import { validateEquation } from './equation.validators.js';
import { solveEquation } from './equation-solver/index.js';

const STEPS_DEFAULT = 0;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 50;

function sanitizePagination(page: number, limit: number): { page: number; limit: number } {
  const p = Math.max(1, Math.floor(page));
  const l = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  return { page: p, limit: l };
}

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(userId: string, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT): Promise<PaginatedEquationsResponse> {
    const { page: p, limit: l } = sanitizePagination(page, limit);
    const [userEquations, total] = await Promise.all([
      this.equationRepository.findAllForUser(userId, p, l),
      this.equationRepository.countForUser(userId),
    ]);
    const data = userEquations.map((eu) => this.toEquationResponse(eu));
    const totalPages = Math.ceil(total / l) || 1;
    return { data, total, page: p, limit: l, totalPages };
  }

  async getEquationById(userEquationId: string): Promise<EquationResponse | null> {
    const userEquation = await this.equationRepository.findById(userEquationId);
    if (!userEquation) return null;
    return this.toEquationResponse(userEquation);
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    const validation = validateEquation(data.expression);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }
    const solveResult = solveEquation(data.expression);
    if (!solveResult.ok) {
      throw new Error(solveResult.message ?? 'La ecuación no tiene solución.');
    }
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

  async getPublicEquations(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT): Promise<PaginatedEquationsResponse> {
    const { page: p, limit: l } = sanitizePagination(page, limit);
    const [defaultEquations, total] = await Promise.all([
      this.equationRepository.findDefaultEquations(p, l),
      this.equationRepository.countDefaultEquations(),
    ]);
    const data = defaultEquations.map((eq) => this.toEquationResponseFromDefault(eq));
    const totalPages = Math.ceil(total / l) || 1;
    return { data, total, page: p, limit: l, totalPages };
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
