import bcrypt from 'bcryptjs';
import type { VerifyPasswordParams } from '../types/password.types.js';

export const BCRYPT_DEFAULT_ROUNDS = 10;

export async function verifyPassword(data: VerifyPasswordParams): Promise<void> {
  const isValid = await bcrypt.compare(data.plainPassword, data.passwordHash);
  if (!isValid) throw new Error(data.invalidMessage);
}

export async function hashPassword(password: string, rounds: number = BCRYPT_DEFAULT_ROUNDS): Promise<string> {
  return bcrypt.hash(password, rounds);
}
