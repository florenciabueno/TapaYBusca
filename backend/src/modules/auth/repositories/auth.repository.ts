import { prisma } from '../../../config/database';
import { User } from '@prisma/client';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
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
}
