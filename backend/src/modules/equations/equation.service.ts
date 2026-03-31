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
import { infixToLatex } from './infix-to-latex.js';
import { ensureValidationPassedWithErrorList } from '../../shared/utils/validation.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../shared/constants/pagination.js';

const STEPS_DEFAULT = 0;
const DOWNLOAD_QUANTITY_MIN = 1;
const DOWNLOAD_QUANTITY_MAX = 50;
const DOWNLOAD_FETCH_MULTIPLIER = 3;
const DOWNLOAD_FETCH_MAX = 200;

const STATUS_ORDER: EquationStatus[] = [
  EquationStatus.IN_PROGRESS,
  EquationStatus.NOT_STARTED,
  EquationStatus.SOLVED,
];

const MESSAGE_EQUATION_VALIDATION_PREFIX = '';
const MESSAGE_EQUATION_NO_SOLUTION = 'La ecuación no tiene solución.';
const MESSAGE_NO_PERMISSION_MODIFY = 'No tienes permisos para modificar esta ecuación';
const MESSAGE_NO_PERMISSION_DELETE = 'No tienes permisos para eliminar esta ecuación';
const MESSAGE_UPLOAD_EQUATIONS_NOT_FOUND = 'Una o más ecuaciones no existen o no te pertenecen.';
const MESSAGE_UPLOAD_ALREADY_PUBLISHED = 'Una o más ecuaciones ya fueron subidas. Solo puedes subir cada ecuación una vez.';
const MESSAGE_DOWNLOAD_QUANTITY_RANGE = `Cantidad debe estar entre ${DOWNLOAD_QUANTITY_MIN} y ${DOWNLOAD_QUANTITY_MAX}.`;
const MESSAGE_DOWNLOAD_FROM_DATE_INVALID = 'Fecha desde no válida.';
const MESSAGE_DOWNLOAD_TO_DATE_INVALID = 'Fecha hasta no válida.';
const MESSAGE_DOWNLOAD_DATE_RANGE = 'La fecha desde no puede ser posterior a la fecha hasta.';

export class EquationService {
  constructor(private equationRepository: EquationRepository) {}

  async getAllEquations(
    userId: string,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    deletedOnly = false
  ): Promise<PaginatedEquationsResponse> {
    const { page: p, limit: l } = this.sanitizePagination(page, limit);
    const [userEquations, total] = await Promise.all([
      this.equationRepository.findAllForUser(
        userId,
        p,
        l,
        origins,
        statuses,
        fromDate,
        toDate,
        deletedOnly
      ),
      this.equationRepository.countForUser(
        userId,
        origins,
        statuses,
        fromDate,
        toDate,
        deletedOnly
      ),
    ]);
    const sorted = this.sortByStatusAndUpdatedAt(userEquations);
    const countMap = await this.getResolutionCountsOrDefault(
      sorted.map((r) => ({
        userEquationId: r.id,
        resolutionSessionId: (r as { currentResolutionId?: number }).currentResolutionId ?? 0,
      }))
    );
    const data = sorted.map((row) => {
      const resolutionId = (row as { currentResolutionId?: number }).currentResolutionId ?? 0;
      const steps = countMap.get(`${row.id}-${resolutionId}`) ?? STEPS_DEFAULT;
      return this.toEquationResponse(row, steps);
    });
    return this.buildPaginatedResponse(data, total, p, l);
  }

  async getEquationById(userEquationId: string): Promise<EquationResponse | null> {
    const userEquation = await this.equationRepository.findById(userEquationId);
    if (!userEquation) return null;
    const resolutionId = (userEquation as { currentResolutionId?: number }).currentResolutionId ?? 0;
    const countMap = await this.getResolutionCountsOrDefault([
      { userEquationId: userEquation.id, resolutionSessionId: resolutionId },
    ]);
    const steps = countMap.get(`${userEquation.id}-${resolutionId}`) ?? STEPS_DEFAULT;
    return this.toEquationResponse(userEquation, steps);
  }

  async createEquation(data: CreateEquationDto): Promise<EquationResponse> {
    ensureValidationPassedWithErrorList(validateEquation(data.expression), MESSAGE_EQUATION_VALIDATION_PREFIX);
    const solveResult = solveEquation(data.expression);
    this.ensureEquationHasSolution(solveResult);
    const latexExpression = infixToLatex(data.expression.trim());
    const equationUser = await this.equationRepository.create({
      ...data,
      latexExpression,
      solutionValues: solveResult.solutions ?? [],
    });
    return this.toEquationResponse(equationUser);
  }

  async updateEquation(
    equationUserId: string,
    data: UpdateEquationUserDto,
    userId: string
  ): Promise<EquationResponse> {
    await this.ensureCanModifyEquation(equationUserId, userId);
    const equationUser = await this.equationRepository.update(equationUserId, data);
    return this.toEquationResponse(equationUser);
  }

  async deleteEquation(equationUserId: string, userId: string): Promise<void> {
    await this.ensureCanDeleteEquation(equationUserId, userId);
    await this.equationRepository.softDelete(equationUserId);
  }

  async getPublicEquations(
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date
  ): Promise<PaginatedEquationsResponse> {
    const { page: p, limit: l } = this.sanitizePagination(page, limit);
    const showOnlyNotStarted = this.publicListIncludesNotStarted(statuses);
    if (!showOnlyNotStarted) {
      return this.buildPaginatedResponse([], 0, p, l);
    }
    const [defaultEquations, total] = await Promise.all([
      this.equationRepository.findDefaultEquations(p, l, fromDate, toDate),
      this.equationRepository.countDefaultEquations(fromDate, toDate),
    ]);
    const data = defaultEquations.map((eq) => this.toEquationResponseFromDefault(eq));
    return this.buildPaginatedResponse(data, total, p, l);
  }

  async getEquationsForUpload(userId: string): Promise<{ data: UploadableEquationResponse[] }> {
    const [rows, publishedIds] = await Promise.all([
      this.equationRepository.findCreatedForUser(userId),
      this.equationRepository.getPublishedEquationIdsForUser(userId),
    ]);
    const data = rows.map((row) => this.toUploadableItem(row, publishedIds));
    return { data };
  }

  async uploadEquations(userId: string, userEquationIds: string[]): Promise<void> {
    if (userEquationIds.length === 0) return;
    await this.ensureCanUploadEquations(userId, userEquationIds);
    for (const userEquationId of userEquationIds) {
      const row = await this.equationRepository.findUserEquationByIdAndUser(userEquationId, userId);
      if (row) {
        await this.equationRepository.createPublishedEquation(row.equationId, userId);
      }
    }
  }

  async downloadEquations(userId: string, dto: DownloadEquationsDto): Promise<DownloadEquationsResult> {
    const params = this.parseAndValidateDownloadParams(dto);
    const limit = Math.min(params.quantity * DOWNLOAD_FETCH_MULTIPLIER, DOWNLOAD_FETCH_MAX);
    const rows = await this.equationRepository.findPublishedInDateRange(
      limit,
      params.fromDate,
      params.toDate
    );
    const uniqueEquationIds = [...new Set(rows.map((r) => r.equationId))];
    const ownedIds = await this.equationRepository.getEquationIdsOwnedByUser(userId);
    const toAdd = uniqueEquationIds.filter((id) => !ownedIds.includes(id)).slice(0, params.quantity);
    const added = await this.equationRepository.addEquationsToUser(
      userId,
      toAdd,
      EquationOrigin.DOWNLOADED
    );
    return { added, totalRequested: params.quantity };
  }

  private sanitizePagination(page: number, limit: number): { page: number; limit: number } {
    const p = Math.max(1, Math.floor(page));
    const l = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
    return { page: p, limit: l };
  }

  private statusOrderIndex(status: string): number {
    const i = STATUS_ORDER.indexOf(status as EquationStatus);
    return i === -1 ? STATUS_ORDER.length : i;
  }

  private sortByStatusAndUpdatedAt(rows: UserEquationRow[]): UserEquationRow[] {
    return [...rows].sort((a, b) => {
      const statusA = this.statusOrderIndex(a.status);
      const statusB = this.statusOrderIndex(b.status);
      if (statusA !== statusB) return statusA - statusB;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  private buildPaginatedResponse(
    data: EquationResponse[],
    total: number,
    page: number,
    limit: number
  ): PaginatedEquationsResponse {
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  private toEquationResponse(row: UserEquationRow, steps = STEPS_DEFAULT): EquationResponse {
    return {
      id: row.id,
      equation: this.getDisplayExpression(row.equation),
      origin: row.origin as EquationOrigin,
      status: row.status as EquationStatus,
      steps,
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

  private toUploadableItem(
    row: { id: string; equationId: string; equation: UserEquationRow['equation'] },
    publishedIds: string[]
  ): UploadableEquationResponse {
    return {
      id: row.id,
      equation: this.getDisplayExpression(row.equation),
      isPublished: publishedIds.includes(row.equationId),
    };
  }

  private getDisplayExpression(equation: {
    latexExpression?: string | null;
    infixExpression?: string | null;
    postfixExpression?: string | null;
  }): string {
    const latex = equation.latexExpression?.trim();
    if (latex) return latex;
    const raw = equation.infixExpression || equation.postfixExpression || '';
    return raw ? infixToLatex(raw) : '';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }

  private ensureEquationHasSolution(solveResult: { ok: boolean; message?: string }): void {
    if (!solveResult.ok) {
      throw new Error(solveResult.message ?? MESSAGE_EQUATION_NO_SOLUTION);
    }
  }

  private async ensureCanModifyEquation(equationUserId: string, userId: string): Promise<void> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) throw new Error(MESSAGE_NO_PERMISSION_MODIFY);
  }

  private async ensureCanDeleteEquation(equationUserId: string, userId: string): Promise<void> {
    const canModify = await this.equationRepository.canUserModify(equationUserId, userId);
    if (!canModify) throw new Error(MESSAGE_NO_PERMISSION_DELETE);
  }

  private async ensureCanUploadEquations(
    userId: string,
    userEquationIds: string[]
  ): Promise<void> {
    const alreadyPublished: string[] = [];
    for (const userEquationId of userEquationIds) {
      const row = await this.equationRepository.findUserEquationByIdAndUser(userEquationId, userId);
      if (!row) throw new Error(MESSAGE_UPLOAD_EQUATIONS_NOT_FOUND);
      const isPublished = await this.equationRepository.isEquationPublishedByUser(row.equationId, userId);
      if (isPublished) {
        const label = row.equation.infixExpression || row.equation.postfixExpression || row.equationId;
        alreadyPublished.push(label);
      }
    }
    if (alreadyPublished.length > 0) throw new Error(MESSAGE_UPLOAD_ALREADY_PUBLISHED);
  }

  private publicListIncludesNotStarted(statuses?: EquationStatus[]): boolean {
    if (!statuses || statuses.length === 0) return true;
    return statuses.includes(EquationStatus.NOT_STARTED);
  }

  private parseAndValidateDownloadParams(dto: DownloadEquationsDto): {
    quantity: number;
    fromDate?: Date;
    toDate?: Date;
  } {
    const quantity = Math.floor(Number(dto.quantity));
    if (quantity < DOWNLOAD_QUANTITY_MIN || quantity > DOWNLOAD_QUANTITY_MAX) {
      throw new Error(MESSAGE_DOWNLOAD_QUANTITY_RANGE);
    }
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (dto.fromDate) {
      fromDate = new Date(dto.fromDate);
      if (Number.isNaN(fromDate.getTime())) throw new Error(MESSAGE_DOWNLOAD_FROM_DATE_INVALID);
    }
    if (dto.toDate) {
      toDate = new Date(dto.toDate);
      if (Number.isNaN(toDate.getTime())) throw new Error(MESSAGE_DOWNLOAD_TO_DATE_INVALID);
    }
    if (fromDate !== undefined && toDate !== undefined && fromDate > toDate) {
      throw new Error(MESSAGE_DOWNLOAD_DATE_RANGE);
    }
    return { quantity, fromDate, toDate };
  }

  private async getResolutionCountsOrDefault(
    pairs: Array<{ userEquationId: string; resolutionSessionId: number }>
  ): Promise<Map<string, number>> {
    if (pairs.length === 0) return new Map();
    const maybeGetResolutionCounts = (
      this.equationRepository as Partial<Pick<EquationRepository, 'getResolutionCounts'>>
    ).getResolutionCounts;
    if (typeof maybeGetResolutionCounts !== 'function') {
      return new Map();
    }
    return maybeGetResolutionCounts.call(this.equationRepository, pairs);
  }
}
