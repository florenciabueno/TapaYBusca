import { prisma } from '../../../config/database.js';
import { User } from '@prisma/client';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async create(userData: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    return await prisma.user.create({
      data: userData,
    });
  }

  async update(id: string, data: { name?: string; passwordHash?: string }): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
