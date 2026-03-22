import { prisma } from '../../config/database.js';
import {
  CreateEquationDto,
  UpdateEquationUserDto,
  EquationStatus,
  EquationOrigin,
} from './equation.types.js';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type UserEquationListWhere = {
  userId: string;
  isActive: boolean;
  origin?: { in: EquationOrigin[] };
  status?: { in: EquationStatus[] };
  updatedAt?: { gte?: Date; lte?: Date };
};

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
    deletedOnly = false
  ) {
    const where = this.buildUserEquationListWhere(
      userId,
      origins,
      statuses,
      fromDate,
      toDate,
      deletedOnly
    );
    return prisma.userEquation.findMany({
      where,
      include: USER_EQUATION_INCLUDE_EQUATION,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countForUser(
    userId: string,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    deletedOnly = false
  ): Promise<number> {
    const where = this.buildUserEquationListWhere(
      userId,
      origins,
      statuses,
      fromDate,
      toDate,
      deletedOnly
    );
    return prisma.userEquation.count({ where });
  }

  async findById(userEquationId: string) {
    return prisma.userEquation.findUnique({
      where: { id: userEquationId },
      include: USER_EQUATION_INCLUDE_EQUATION,
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

  private buildUserEquationListWhere(
    userId: string,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date,
    deletedOnly = false
  ): UserEquationListWhere {
    const where: UserEquationListWhere = { userId, isActive: !deletedOnly };
    if (origins && origins.length > 0) where.origin = { in: origins };
    if (statuses && statuses.length > 0) where.status = { in: statuses };
    if (fromDate !== undefined || toDate !== undefined) {
      where.updatedAt = {};
      if (fromDate !== undefined) where.updatedAt.gte = fromDate;
      if (toDate !== undefined) where.updatedAt.lte = this.endOfDay(toDate);
    }
    return where;
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
