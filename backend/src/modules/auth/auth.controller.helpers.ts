import { LoginCredentials, RegisterCredentials } from './auth.types.js';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readTrimmedString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? (record[key] as string).trim() : '';
}

export function parseLoginBody(body: unknown): LoginCredentials {
  const b = asObject(body);
  return {
    email: readTrimmedString(b, 'email'),
    password: readTrimmedString(b, 'password'),
  };
}

export function parseRegisterBody(body: unknown): RegisterCredentials {
  const b = asObject(body);
  return {
    email: readTrimmedString(b, 'email'),
    name: readTrimmedString(b, 'name'),
    password: readTrimmedString(b, 'password'),
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
