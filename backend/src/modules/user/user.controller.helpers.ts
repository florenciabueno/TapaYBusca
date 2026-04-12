import type { UpdateProfileDto } from './user.types.js';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readOptionalTrimmedString(record: Record<string, unknown>, key: string): string | undefined {
  if (!(key in record) || record[key] === undefined || record[key] === null) return undefined;
  return typeof record[key] === 'string' ? (record[key] as string).trim() : '';
}

export function parseUpdateProfileBody(body: unknown): UpdateProfileDto {
  const b = asObject(body);
  return {
    name: readOptionalTrimmedString(b, 'name'),
    currentPassword: readOptionalTrimmedString(b, 'currentPassword'),
    password: readOptionalTrimmedString(b, 'password'),
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
