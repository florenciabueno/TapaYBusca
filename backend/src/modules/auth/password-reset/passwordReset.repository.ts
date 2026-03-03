import { prisma } from '../../../config/database.js';

export class PasswordResetRepository {
  async findUserIdByEmail(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async invalidateAllUnusedTokensForUser(userId: string, usedAt: Date): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt },
    });
  }

  async createToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<void> {
    await this.invalidateAllUnusedTokensForUser(params.userId, params.now);
    await prisma.passwordResetToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
      },
    });
  }

  async resetPasswordWithToken(params: {
    tokenHash: string;
    now: Date;
    newPasswordHash: string;
  }): Promise<boolean> {
    const result = await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash: params.tokenHash,
          usedAt: null,
          expiresAt: { gt: params.now },
        },
        select: { id: true, userId: true },
      });

      if (!token) return false;

      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash: params.newPasswordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: params.now },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, usedAt: null },
        data: { usedAt: params.now },
      });

      return true;
    });

    return result;
  }
}

