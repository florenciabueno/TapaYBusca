import { prisma } from '../../config/database.js';
import { User } from '@prisma/client';
import type { CreateUserPayload } from './auth.types.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: CreateUserPayload): Promise<User> {
    return await prisma.user.create({
      data: userData,
    });
  }
}
