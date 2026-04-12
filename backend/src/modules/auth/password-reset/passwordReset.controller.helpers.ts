import type { ForgotPasswordBody, ResetPasswordBody } from './passwordReset.types.js';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readTrimmedString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? (record[key] as string).trim() : '';
}

export function parseForgotPasswordBody(body: unknown): ForgotPasswordBody {
  const b = asObject(body);
  return {
    email: readTrimmedString(b, 'email'),
  };
}

export function parseResetPasswordBody(body: unknown): ResetPasswordBody {
  const b = asObject(body);
  return {
    token: readTrimmedString(b, 'token'),
    newPassword: readTrimmedString(b, 'newPassword'),
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
