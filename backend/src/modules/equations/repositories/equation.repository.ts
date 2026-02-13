import { PrismaClient } from '@prisma/client';
import { CreateEquationDto, UpdateEquationUserDto, EquationStatus, EquationOrigin } from '../types/equation.types.js';

const prisma = new PrismaClient();

export class EquationRepository {
  async findAllForUser(userId: string) {
    const ecuacionesUsuario = await prisma.ecuacionUsuario.findMany({
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

    return ecuacionesUsuario;
  }

  async findById(ecuacionUsuarioId: string) {
    return prisma.ecuacionUsuario.findUnique({
      where: { id: ecuacionUsuarioId },
      include: {
        ecuacion: true,
      },
    });
  }

  async create(data: CreateEquationDto) {
    // Crear la ecuación
    const nuevaEcuacion = await prisma.ecuacion.create({
      data: {
        expresionPostfija: data.expresion,
        idCreador: data.userId,
        porDefecto: false,
      },
    });

    // Crear la relación ecuación-usuario
    const ecuacionUsuario = await prisma.ecuacionUsuario.create({
      data: {
        usuarioId: data.userId,
        ecuacionId: nuevaEcuacion.id,
        estado: EquationStatus.SIN_COMENZAR,
        origen: EquationOrigin.CREADA,
        activa: true,
      },
      include: {
        ecuacion: true,
      },
    });

    return ecuacionUsuario;
  }

  async update(ecuacionUsuarioId: string, data: UpdateEquationUserDto) {
    return prisma.ecuacionUsuario.update({
      where: { id: ecuacionUsuarioId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        ecuacion: true,
      },
    });
  }

  async softDelete(ecuacionUsuarioId: string) {
    return prisma.ecuacionUsuario.update({
      where: { id: ecuacionUsuarioId },
      data: {
        activa: false,
        updatedAt: new Date(),
      },
    });
  }

  async canUserModify(ecuacionUsuarioId: string, userId: string): Promise<boolean> {
    const ecuacionUsuario = await prisma.ecuacionUsuario.findUnique({
      where: { id: ecuacionUsuarioId },
      select: { usuarioId: true, origen: true },
    });

    if (!ecuacionUsuario) return false;
    
    return ecuacionUsuario.usuarioId === userId;
  }

  async addDefaultEquationsToUser(userId: string) {
    // Obtener todas las ecuaciones por defecto
    const ecuacionesDefecto = await prisma.ecuacion.findMany({
      where: { porDefecto: true },
    });

    // Crear registros en EcuacionUsuario para cada ecuación por defecto
    const promises = ecuacionesDefecto.map(ecuacion =>
      prisma.ecuacionUsuario.create({
        data: {
          usuarioId: userId,
          ecuacionId: ecuacion.id,
          estado: EquationStatus.SIN_COMENZAR,
          origen: EquationOrigin.POR_DEFECTO,
          activa: true,
        },
      })
    );

    await Promise.all(promises);
  }
}
