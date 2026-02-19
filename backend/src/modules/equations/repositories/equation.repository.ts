import { PrismaClient } from '@prisma/client';
import { CreateEquationDto, UpdateEquationUserDto, EquationStatus, EquationOrigin } from '../types/equation.types.js';

const prisma = new PrismaClient();

export class EquationRepository {
  async findAllForUser(userId: string) {
    const userEquations = await prisma.ecuacionUsuario.findMany({
      where: {
        usuarioId: userId,
        activa: true,
      },
      include: {
        ecuacion: true,
      },
      orderBy: [
        { estado: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    return userEquations;
  }

  async findById(equationUserId: string) {
    return prisma.ecuacionUsuario.findUnique({
      where: { id: equationUserId },
      include: {
        ecuacion: true,
      },
    });
  }

  async create(data: CreateEquationDto) {
    const newEquation = await prisma.ecuacion.create({
      data: {
        expresionPostfija: data.expresion,
        idCreador: data.userId,
        porDefecto: false,
      },
    });

    const userEquation = await prisma.ecuacionUsuario.create({
      data: {
        usuarioId: data.userId,
        ecuacionId: newEquation.id,
        estado: EquationStatus.SIN_COMENZAR,
        origen: EquationOrigin.CREADA,
        activa: true,
      },
      include: {
        ecuacion: true,
      },
    });

    return userEquation;
  }

  async update(equationUserId: string, data: UpdateEquationUserDto) {
    return prisma.ecuacionUsuario.update({
      where: { id: equationUserId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        ecuacion: true,
      },
    });
  }

  async softDelete(equationUserId: string) {
    return prisma.ecuacionUsuario.update({
      where: { id: equationUserId },
      data: {
        activa: false,
        updatedAt: new Date(),
      },
    });
  }

  async canUserModify(equationUserId: string, userId: string): Promise<boolean> {
    const userEquation = await prisma.ecuacionUsuario.findUnique({
      where: { id: equationUserId },
      select: { usuarioId: true, origen: true },
    });

    if (!userEquation) return false;
    
    return userEquation.usuarioId === userId;
  }

  async addDefaultEquationsToUser(userId: string) {
    const defaultEquations = await prisma.ecuacion.findMany({
      where: { porDefecto: true },
    });

    const promises = defaultEquations.map(equation =>
      prisma.ecuacionUsuario.create({
        data: {
          usuarioId: userId,
          ecuacionId: equation.id,
          estado: EquationStatus.SIN_COMENZAR,
          origen: EquationOrigin.POR_DEFECTO,
          activa: true,
        },
      })
    );

    await Promise.all(promises);
  }
}
