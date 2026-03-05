import { PrismaClient } from '@prisma/client';
import { CreateEquationDto, UpdateEquationUserDto, EquationStatus, EquationOrigin } from './equation.types.js';

const prisma = new PrismaClient();

type ListWhere = {
  userId: string;
  isActive: boolean;
  origin?: { in: EquationOrigin[] };
  status?: { in: EquationStatus[] };
  updatedAt?: { gte?: Date; lte?: Date };
};

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function buildListWhere(
  userId: string,
  origins?: EquationOrigin[],
  statuses?: EquationStatus[],
  fromDate?: Date,
  toDate?: Date
): ListWhere {
  const where: ListWhere = { userId, isActive: true };
  if (origins && origins.length > 0) {
    where.origin = { in: origins };
  }
  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }
  if (fromDate !== undefined || toDate !== undefined) {
    where.updatedAt = {};
    if (fromDate !== undefined) where.updatedAt.gte = fromDate;
    if (toDate !== undefined) where.updatedAt.lte = endOfDay(toDate);
  }
  return where;
}

export class EquationRepository {
  async findAllForUser(
    userId: string,
    page: number,
    limit: number,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date
  ) {
    const where = buildListWhere(userId, origins, statuses, fromDate, toDate);
    const userEquations = await prisma.userEquation.findMany({
      where,
      include: {
        equation: true,
      },
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return userEquations;
  }

  async countForUser(
    userId: string,
    origins?: EquationOrigin[],
    statuses?: EquationStatus[],
    fromDate?: Date,
    toDate?: Date
  ): Promise<number> {
    const where = buildListWhere(userId, origins, statuses, fromDate, toDate);
    return prisma.userEquation.count({ where });
  }

  async findById(userEquationId: string) {
    return prisma.userEquation.findUnique({
      where: { id: userEquationId },
      include: {
        equation: true,
      },
    });
  }

  async create(data: CreateEquationDto) {
    const expression = data.expression.trim();
    const newEquation = await prisma.equation.create({
      data: {
        postfixExpression: expression,
        infixExpression: expression,
        creatorId: data.userId,
        isDefault: false,
      },
    });

    const userEquation = await prisma.userEquation.create({
      data: {
        userId: data.userId,
        equationId: newEquation.id,
        status: EquationStatus.NOT_STARTED,
        origin: EquationOrigin.CREATED,
        isActive: true,
      },
      include: {
        equation: true,
      },
    });

    return userEquation;
  }

  async update(userEquationId: string, data: UpdateEquationUserDto) {
    return prisma.userEquation.update({
      where: { id: userEquationId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        equation: true,
      },
    });
  }

  async softDelete(userEquationId: string) {
    return prisma.userEquation.update({
      where: { id: userEquationId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async canUserModify(userEquationId: string, userId: string): Promise<boolean> {
    const userEquation = await prisma.userEquation.findUnique({
      where: { id: userEquationId },
      select: { userId: true, origin: true },
    });

    if (!userEquation) return false;
    
    return userEquation.userId === userId;
  }

  async addDefaultEquationsToUser(userId: string) {
    const defaultEquations = await prisma.equation.findMany({
      where: { isDefault: true },
    });

    const promises = defaultEquations.map(equation =>
      prisma.userEquation.create({
        data: {
          userId: userId,
          equationId: equation.id,
          status: EquationStatus.NOT_STARTED,
          origin: EquationOrigin.DEFAULT,
          isActive: true,
        },
      })
    );

    await Promise.all(promises);
  }

  async findDefaultEquations(page: number, limit: number) {
    return prisma.equation.findMany({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async countDefaultEquations(): Promise<number> {
    return prisma.equation.count({
      where: { isDefault: true },
    });
  }

  async findCreatedForUser(userId: string, limit = 500) {
    return prisma.userEquation.findMany({
      where: {
        userId,
        isActive: true,
        origin: EquationOrigin.CREATED,
      },
      include: { equation: true },
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
  ): Promise<{ id: string; equationId: string; equation: { infixExpression?: string | null; postfixExpression?: string | null; latexExpression?: string | null } } | null> {
    const row = await prisma.userEquation.findFirst({
      where: { id: userEquationId, userId },
      include: { equation: true },
    });
    return row;
  }

  async isEquationPublishedByUser(equationId: string, userId: string): Promise<boolean> {
    const existing = await prisma.publishedEquation.findUnique({
      where: {
        equationId_userId: { equationId, userId },
      },
    });
    return existing !== null;
  }

  async createPublishedEquation(equationId: string, userId: string) {
    return prisma.publishedEquation.create({
      data: { equationId, userId },
    });
  }

  async findPublishedInDateRange(limit: number, from?: Date, to?: Date) {
    const where: { publishedAt?: { gte?: Date; lte?: Date } } = {};
    if (from !== undefined || to !== undefined) {
      where.publishedAt = {};
      if (from !== undefined) where.publishedAt.gte = from;
      if (to !== undefined) where.publishedAt.lte = to;
    }
    return prisma.publishedEquation.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
    const data = equationIds.map((equationId) => ({
      userId,
      equationId,
      status: EquationStatus.NOT_STARTED,
      origin,
      isActive: true,
    }));
    const result = await prisma.userEquation.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }
}
