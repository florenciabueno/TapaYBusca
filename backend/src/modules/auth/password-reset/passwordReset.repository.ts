import { prisma } from '../../../config/database.js';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class PasswordResetRepository {
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
    return prisma.$transaction(async (tx) => {
      const token = await this.findValidToken(tx, params);
      if (!token) return false;

      await this.updateUserPassword(tx, token.userId, params.newPasswordHash);
      await this.markTokenAsUsed(tx, token.id, params.now);
      await this.invalidateUnusedTokensForUser(tx, token.userId, params.now);

      return true;
    });
  }

  private async findValidToken(
    tx: TxClient,
    params: { tokenHash: string; now: Date }
  ): Promise<{ id: string; userId: string } | null> {
    return tx.passwordResetToken.findFirst({
      where: {
        tokenHash: params.tokenHash,
        usedAt: null,
        expiresAt: { gt: params.now },
      },
      select: { id: true, userId: true },
    });
  }

  private async updateUserPassword(
    tx: TxClient,
    userId: string,
    newPasswordHash: string
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  private async markTokenAsUsed(
    tx: TxClient,
    tokenId: string,
    usedAt: Date
  ): Promise<void> {
    await tx.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt },
    });
  }

  private async invalidateUnusedTokensForUser(
    tx: TxClient,
    userId: string,
    usedAt: Date
  ): Promise<void> {
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt },
    });
  }
}

