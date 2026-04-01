import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  CreateEquationDto,
  UpdateEquationUserDto,
  EquationStatus,
  EquationOrigin,
} from './equation.types.js';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const LIST_STATUS_ORDER = [
  EquationStatus.IN_PROGRESS,
  EquationStatus.NOT_STARTED,
  EquationStatus.SOLVED,
] as const;

const USER_EQUATION_INCLUDE_EQUATION = { equation: true } as const;
const DEFAULT_EQUATION_WHERE = { isDefault: true } as const;

export class EquationRepository {
  async findAllForUser(
    userId: string,
    page: number,
    limit: number,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    includeDeleted = false
  ) {
    const where = this.buildUserEquationListWhere(
      userId,
      origins,
      statuses,
      fromDate,
      toDate,
      includeDeleted
    );
    const all = await prisma.userEquation.findMany({
      where,
      include: USER_EQUATION_INCLUDE_EQUATION,
    });
    const sorted = this.sortUserEquationsForList(all);
    const start = (page - 1) * limit;
    return sorted.slice(start, start + limit);
  }

  async countForUser(
    userId: string,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    includeDeleted = false
  ): Promise<number> {
    const where = this.buildUserEquationListWhere(
      userId,
      origins,
      statuses,
      fromDate,
      toDate,
      includeDeleted
    );
    return prisma.userEquation.count({ where });
  }

  async findById(userEquationId: string) {
    return prisma.userEquation.findUnique({
      where: { id: userEquationId },
      include: USER_EQUATION_INCLUDE_EQUATION,
    });
  }

  async findByIdWithEquation(userEquationId: string) {
    return prisma.userEquation.findUnique({
      where: { id: userEquationId },
      include: { equation: true },
    });
  }

  async updateResolutionState(
    userEquationId: string,
    data: { status?: EquationStatus; currentResolutionId?: number; selectedBranch?: string }
  ) {
    return prisma.userEquation.update({
      where: { id: userEquationId },
      data: { ...data, updatedAt: new Date() },
      include: { equation: true },
    });
  }

  async createResolution(data: {
    userEquationId: string;
    resolutionSessionId: number;
    subEquation: string;
    subEquationInfix?: string | null;
    proposedResult: string;
    resultValue: string;
    stepWithoutSolution: boolean;
    isCorrect: boolean;
    isVariable: boolean;
    resolutionSide: number;
  }) {
    return prisma.resolution.create({
      data: {
        ...data,
        subEquationInfix: data.subEquationInfix ?? undefined,
      },
    });
  }

  async findResolutionsByUserEquation(userEquationId: string, resolutionSessionId: number) {
    return prisma.resolution.findMany({
      where: { userEquationId, resolutionSessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getResolutionCounts(
    pairs: Array<{ userEquationId: string; resolutionSessionId: number }>
  ): Promise<Map<string, number>> {
    if (pairs.length === 0) return new Map();
    const ids = [...new Set(pairs.map((p) => p.userEquationId))];
    const groups = await prisma.resolution.groupBy({
      by: ['userEquationId', 'resolutionSessionId'],
      _count: { id: true },
      where: { userEquationId: { in: ids } },
    });
    const map = new Map<string, number>();
    for (const g of groups) {
      map.set(`${g.userEquationId}-${g.resolutionSessionId}`, g._count.id);
    }
    return map;
  }

  async getPreviousStep(
    userEquationId: string,
    resolutionSessionId: number,
    bifurcoResolucion: boolean,
    statusResolucion: number
  ) {
    const BIFURCO = 2;
    const NO_BIFURCO = 1;
    const where: { userEquationId: string; resolutionSessionId: number; isCorrect: boolean; isVariable?: boolean; resolutionSide?: number } = {
      userEquationId,
      resolutionSessionId,
      isCorrect: true,
    };
    if (bifurcoResolucion) {
      where.resolutionSide = BIFURCO;
    } else {
      if (statusResolucion === BIFURCO) {
        const bifurcoStep = await prisma.resolution.findFirst({
          where: { userEquationId, resolutionSessionId, isCorrect: true, resolutionSide: BIFURCO },
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        if (!bifurcoStep) return null;
        return prisma.resolution.findFirst({
          where: {
            userEquationId,
            resolutionSessionId,
            isCorrect: true,
            isVariable: false,
            resolutionSide: NO_BIFURCO,
            id: { lt: bifurcoStep.id },
          },
          orderBy: { id: 'desc' },
        });
      }
      where.isVariable = false;
    }
    return prisma.resolution.findFirst({
      where,
      orderBy: { id: 'desc' },
    });
  }

  async getDistinctLoggedSolutions(userEquationId: string, resolutionSessionId: number): Promise<number[]> {
    const rows = await prisma.resolution.findMany({
      where: { userEquationId, resolutionSessionId, isVariable: true, isCorrect: true },
      select: { resultValue: true },
    });
    const values = new Set<number>();
    for (const row of rows) {
      const parts = row.resultValue.split(';').filter(Boolean);
      for (const p of parts) {
        const n = Number(p.trim());
        if (!Number.isNaN(n) && Number.isFinite(n)) values.add(n);
      }
    }
    return [...values];
  }

  async countStepsWithoutSolution(userEquationId: string, resolutionSessionId: number): Promise<number> {
    return prisma.resolution.count({
      where: { userEquationId, resolutionSessionId, stepWithoutSolution: true },
    });
  }

  async deleteResolutionsByUserEquation(userEquationId: string) {
    return prisma.resolution.deleteMany({
      where: { userEquationId },
    });
  }

  async create(data: CreateEquationDto) {
    return prisma.$transaction(async (tx) => {
      const equation = await this.createEquationRecord(tx, data);
      return this.createUserEquationWithEquation(tx, data.userId, equation.id);
    });
  }

  async update(userEquationId: string, data: UpdateEquationUserDto) {
    return prisma.userEquation.update({
      where: { id: userEquationId },
      data: { ...data, updatedAt: new Date() },
      include: USER_EQUATION_INCLUDE_EQUATION,
    });
  }

  async softDelete(userEquationId: string) {
    return prisma.userEquation.update({
      where: { id: userEquationId },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async canUserModify(userEquationId: string, userId: string): Promise<boolean> {
    const row = await prisma.userEquation.findUnique({
      where: { id: userEquationId },
      select: { userId: true },
    });
    return row?.userId === userId;
  }

  async addDefaultEquationsToUser(userId: string): Promise<void> {
    const defaultIds = await prisma.equation.findMany({
      where: DEFAULT_EQUATION_WHERE,
      select: { id: true },
    });
    if (defaultIds.length === 0) return;
    await prisma.userEquation.createMany({
      data: defaultIds.map(({ id }) => ({
        userId,
        equationId: id,
        status: EquationStatus.NOT_STARTED,
        origin: EquationOrigin.DEFAULT,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  async findDefaultEquations(
    page: number,
    limit: number,
    fromDate?: Date,
    toDate?: Date
  ) {
    const where = this.buildDefaultEquationWhere(fromDate, toDate);
    return prisma.equation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countDefaultEquations(fromDate?: Date, toDate?: Date): Promise<number> {
    const where = this.buildDefaultEquationWhere(fromDate, toDate);
    return prisma.equation.count({ where });
  }

  async findCreatedForUser(userId: string, limit = 500) {
    return prisma.userEquation.findMany({
      where: {
        userId,
        isActive: true,
        origin: EquationOrigin.CREATED,
      },
      include: USER_EQUATION_INCLUDE_EQUATION,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getPublishedEquationIdsForUser(userId: string): Promise<string[]> {
    const rows = await prisma.publishedEquation.findMany({
      where: { userId },
      select: { equationId: true },
    });
    return rows.map((r) => r.equationId);
  }

  async findUserEquationByIdAndUser(
    userEquationId: string,
    userId: string
  ): Promise<{
    id: string;
    equationId: string;
    equation: {
      infixExpression?: string | null;
      postfixExpression?: string | null;
      latexExpression?: string | null;
    };
  } | null> {
    return prisma.userEquation.findFirst({
      where: { id: userEquationId, userId },
      include: { equation: true },
    });
  }

  async isEquationPublishedByUser(
    equationId: string,
    userId: string
  ): Promise<boolean> {
    const existing = await prisma.publishedEquation.findUnique({
      where: { equationId_userId: { equationId, userId } },
    });
    return existing !== null;
  }

  async createPublishedEquation(equationId: string, userId: string) {
    return prisma.publishedEquation.create({
      data: { equationId, userId },
    });
  }

  async findPublishedInDateRange(limit: number, from?: Date, to?: Date) {
    const where = this.buildPublishedDateRangeWhere(from, to);
    return prisma.publishedEquation.findMany({
      where,
      include: { equation: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getEquationIdsOwnedByUser(userId: string): Promise<string[]> {
    const rows = await prisma.userEquation.findMany({
      where: { userId, isActive: true },
      select: { equationId: true },
    });
    return rows.map((r) => r.equationId);
  }

  async addEquationsToUser(
    userId: string,
    equationIds: string[],
    origin: EquationOrigin
  ): Promise<number> {
    if (equationIds.length === 0) return 0;
    const result = await prisma.userEquation.createMany({
      data: equationIds.map((equationId) => ({
        userId,
        equationId,
        status: EquationStatus.NOT_STARTED,
        origin,
        isActive: true,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  private sortUserEquationsForList<T extends { status: string; updatedAt: Date }>(
    rows: T[]
  ): T[] {
    const rank = (s: string) => {
      const i = (LIST_STATUS_ORDER as readonly string[]).indexOf(s);
      return i === -1 ? LIST_STATUS_ORDER.length : i;
    };
    return [...rows].sort((a, b) => {
      const dr = rank(a.status) - rank(b.status);
      if (dr !== 0) return dr;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  private buildUserEquationListWhere(
    userId: string,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    includeDeleted = false
  ): Prisma.UserEquationWhereInput {
    const hasWorkflowFilter = statuses !== undefined && statuses.length > 0;
    const dateClause: Prisma.UserEquationWhereInput =
      fromDate !== undefined || toDate !== undefined
        ? {
            updatedAt: {
              ...(fromDate !== undefined ? { gte: fromDate } : {}),
              ...(toDate !== undefined ? { lte: this.endOfDay(toDate) } : {}),
            },
          }
        : {};

    const originClause: Prisma.UserEquationWhereInput =
      origins && origins.length > 0 ? { origin: { in: origins } } : {};

    const base: Prisma.UserEquationWhereInput = {
      userId,
      ...originClause,
      ...dateClause,
    };

    if (includeDeleted && hasWorkflowFilter) {
      return {
        ...base,
        OR: [{ isActive: true, status: { in: statuses } }, { isActive: false }],
      };
    }
    if (includeDeleted && !hasWorkflowFilter) {
      return { ...base, isActive: false };
    }
    if (!includeDeleted && hasWorkflowFilter) {
      return { ...base, isActive: true, status: { in: statuses } };
    }
    return { ...base, isActive: true };
  }

  private buildDefaultEquationWhere(
    fromDate?: Date,
    toDate?: Date
  ): { isDefault: true; createdAt?: { gte?: Date; lte?: Date } } {
    const where: { isDefault: true; createdAt?: { gte?: Date; lte?: Date } } = {
      ...DEFAULT_EQUATION_WHERE,
    };
    if (fromDate !== undefined || toDate !== undefined) {
      where.createdAt = {};
      if (fromDate !== undefined) where.createdAt.gte = fromDate;
      if (toDate !== undefined) where.createdAt.lte = this.endOfDay(toDate);
    }
    return where;
  }

  private buildPublishedDateRangeWhere(
    from?: Date,
    to?: Date
  ): { publishedAt: { gte?: Date; lte?: Date } } | undefined {
    if (from === undefined && to === undefined) return undefined;
    const publishedAt: { gte?: Date; lte?: Date } = {};
    if (from !== undefined) publishedAt.gte = from;
    if (to !== undefined) publishedAt.lte = this.endOfDay(to);
    return { publishedAt };
  }

  private async createEquationRecord(
    tx: TxClient,
    data: CreateEquationDto
  ): Promise<{ id: string }> {
    const expression = data.expression.trim();
    return tx.equation.create({
      data: {
        postfixExpression: expression,
        infixExpression: expression,
        latexExpression: data.latexExpression ?? null,
        solutionValues: data.solutionValues ?? undefined,
        creatorId: data.userId,
        isDefault: false,
      },
      select: { id: true },
    });
  }

  private async createUserEquationWithEquation(
    tx: TxClient,
    userId: string,
    equationId: string
  ) {
    return tx.userEquation.create({
      data: {
        userId,
        equationId,
        status: EquationStatus.NOT_STARTED,
        origin: EquationOrigin.CREATED,
        isActive: true,
      },
      include: USER_EQUATION_INCLUDE_EQUATION,
    });
  }
}
