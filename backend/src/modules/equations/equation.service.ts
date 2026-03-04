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
  UploadableEquationResponse,
  DownloadEquationsDto,
  DownloadEquationsResult,
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

  async getEquationsForUpload(userId: string): Promise<{ data: UploadableEquationResponse[] }> {
    const [rows, publishedIds] = await Promise.all([
      this.equationRepository.findCreatedForUser(userId),
      this.equationRepository.getPublishedEquationIdsForUser(userId),
    ]);
    const data: UploadableEquationResponse[] = rows.map((row) => ({
      id: row.id,
      equation: this.getDisplayExpression(row.equation),
      isPublished: publishedIds.includes(row.equationId),
    }));
    return { data };
  }

  async uploadEquations(userId: string, userEquationIds: string[]): Promise<void> {
    if (userEquationIds.length === 0) return;

    const alreadyPublished: string[] = [];
    for (const userEquationId of userEquationIds) {
      const row = await this.equationRepository.findUserEquationByIdAndUser(userEquationId, userId);
      if (!row) {
        throw new Error('Una o más ecuaciones no existen o no te pertenecen.');
      }
      const isPublished = await this.equationRepository.isEquationPublishedByUser(row.equationId, userId);
      if (isPublished) {
        alreadyPublished.push(row.equation.infixExpression || row.equation.postfixExpression || row.equationId);
      }
    }
    if (alreadyPublished.length > 0) {
      throw new Error('Una o más ecuaciones ya fueron subidas. Solo puedes subir cada ecuación una vez.');
    }

    for (const userEquationId of userEquationIds) {
      const row = await this.equationRepository.findUserEquationByIdAndUser(userEquationId, userId);
      if (row) {
        await this.equationRepository.createPublishedEquation(row.equationId, userId);
      }
    }
  }

  private static readonly DOWNLOAD_QUANTITY_MIN = 1;
  private static readonly DOWNLOAD_QUANTITY_MAX = 50;

  async downloadEquations(userId: string, dto: DownloadEquationsDto): Promise<DownloadEquationsResult> {
    const quantity = Math.floor(Number(dto.quantity));
    if (quantity < EquationService.DOWNLOAD_QUANTITY_MIN || quantity > EquationService.DOWNLOAD_QUANTITY_MAX) {
      throw new Error(`Cantidad debe estar entre ${EquationService.DOWNLOAD_QUANTITY_MIN} y ${EquationService.DOWNLOAD_QUANTITY_MAX}.`);
    }
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (dto.fromDate) {
      fromDate = new Date(dto.fromDate);
      if (Number.isNaN(fromDate.getTime())) throw new Error('Fecha desde no válida.');
    }
    if (dto.toDate) {
      toDate = new Date(dto.toDate);
      if (Number.isNaN(toDate.getTime())) throw new Error('Fecha hasta no válida.');
    }
    if (fromDate !== undefined && toDate !== undefined && fromDate > toDate) {
      throw new Error('La fecha desde no puede ser posterior a la fecha hasta.');
    }
    const limit = Math.min(quantity * 3, 200);
    const rows = await this.equationRepository.findPublishedInDateRange(fromDate, toDate, limit);
    const uniqueEquationIds = [...new Set(rows.map((r) => r.equationId))];
    const ownedIds = await this.equationRepository.getEquationIdsOwnedByUser(userId);
    const toAdd = uniqueEquationIds.filter((id) => !ownedIds.includes(id)).slice(0, quantity);
    const added = await this.equationRepository.addEquationsToUser(userId, toAdd, EquationOrigin.DOWNLOADED);
    return { added, totalRequested: quantity };
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
