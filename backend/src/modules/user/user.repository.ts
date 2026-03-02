import { prisma } from '../../config/database.js';
import { User } from '@prisma/client';
import { UserUpdatePayload } from './user.types.js';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UserUpdatePayload): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
