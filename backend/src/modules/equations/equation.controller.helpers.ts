import type { Request } from 'express';
import {
  CreateEquationDto,
  DownloadEquationsDto,
  EquationOrigin,
  EquationStatus,
  ResolveStepDto,
  UpdateEquationUserDto,
  UploadEquationsDto,
} from './equation.types.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../shared/constants/pagination.js';

const VALID_ORIGINS = new Set<string>(Object.values(EquationOrigin));
const VALID_STATUSES = new Set<string>(Object.values(EquationStatus));
const LIST_STATUS_DELETED = 'DELETED';
const PERMISSION_ERROR_KEYWORD = 'permisos';
const GUEST_SESSION_ID_HEADER = 'x-guest-session-id';
const GUEST_SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{16,120}$/;

type QueryParams = Request['query'];
type RouteParams = Request['params'];

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function parseCsvQuery(rawValue: unknown): string[] {
  if (rawValue === undefined || rawValue === '') return [];
  const values = Array.isArray(rawValue) ? rawValue : [rawValue];

  return values
    .filter((value): value is string => typeof value === 'string')
    .flatMap((value) => value.split(',').map((token) => token.trim()))
    .filter((token) => token.length > 0);
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const asString = typeof value === 'string' ? value.trim() : String(value);
  if (!asString) return undefined;

  const date = new Date(asString);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parsePageAndLimit(query: QueryParams): { page: number; limit: number } {
  const page = Math.max(DEFAULT_PAGE, parseInt(String(query.page), 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit), 10) || DEFAULT_LIMIT));
  return { page, limit };
}

export function parseOriginsQuery(query: QueryParams): EquationOrigin[] | undefined {
  const parsed = parseCsvQuery(query.origins).filter((value) => VALID_ORIGINS.has(value));
  return parsed.length === 0 ? undefined : (parsed as EquationOrigin[]);
}

export function parseStatusesQuery(query: QueryParams): EquationStatus[] | undefined {
  const parsed = parseCsvQuery(query.statuses).filter((value) => VALID_STATUSES.has(value));
  return parsed.length === 0 ? undefined : (parsed as EquationStatus[]);
}

export function parseUserListStatusesQuery(query: QueryParams): {
  workflowStatuses?: EquationStatus[];
  includeDeleted: boolean;
} {
  const tokens = parseCsvQuery(query.statuses);
  const includeDeleted = tokens.includes(LIST_STATUS_DELETED);
  const workflowStatuses = tokens.filter(
    (value): value is EquationStatus => value !== LIST_STATUS_DELETED && VALID_STATUSES.has(value)
  );

  return {
    workflowStatuses: workflowStatuses.length === 0 ? undefined : workflowStatuses,
    includeDeleted,
  };
}

export function parseDateFilters(
  query: QueryParams
): { fromDate?: Date; toDate?: Date } | { error: string } {
  const fromDate = parseOptionalDate(query.fromDate);
  const toDate = parseOptionalDate(query.toDate);

  if (fromDate !== undefined && toDate !== undefined && fromDate > toDate) {
    return { error: 'La fecha desde no puede ser posterior a la fecha hasta.' };
  }

  return { fromDate, toDate };
}

export function parseUserEquationIds(body: unknown): string[] {
  const arr = asObject(body).userEquationIds;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function parseUploadEquationsBody(body: unknown): UploadEquationsDto {
  return { userEquationIds: parseUserEquationIds(body) };
}

export function parseDownloadBody(body: unknown): DownloadEquationsDto {
  const b = asObject(body);
  return {
    quantity: typeof b.quantity === 'number' ? b.quantity : parseInt(String(b.quantity ?? 0), 10),
    fromDate: typeof b.fromDate === 'string' ? b.fromDate : undefined,
    toDate: typeof b.toDate === 'string' ? b.toDate : undefined,
  };
}

export function parseResolveStepBody(body: unknown): ResolveStepDto {
  const b = asObject(body);
  const subEquationInfix = typeof b.subEquationInfix === 'string' ? b.subEquationInfix : undefined;
  const answer = typeof b.answer === 'string' ? b.answer : '';
  const resolutionStepStatus =
    typeof b.resolutionStepStatus === 'number' ? b.resolutionStepStatus : undefined;

  return {
    subEquationInfix,
    answer,
    resolutionStepStatus: resolutionStepStatus ?? 1,
  };
}

export function parseUserEquationIdParam(params: RouteParams): string {
  const id = typeof params.id === 'string' ? params.id.trim() : '';
  if (!id) throw new Error('ID de ecuación inválido.');
  return id;
}



export function parseGuestSessionId(req: Request): string {
  const headerValue = req.headers[GUEST_SESSION_ID_HEADER];
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const guestSessionId = typeof raw === 'string' ? raw.trim() : '';
  if (!guestSessionId || !GUEST_SESSION_ID_PATTERN.test(guestSessionId)) {
    throw new Error('Sesión de invitado inválida.');
  }
  return guestSessionId;
}

export function parseCreateEquationBody(body: unknown, userId: string): CreateEquationDto {
  const b = asObject(body);
  const equation = typeof b.equation === 'string' ? b.equation.trim() : '';
  if (!equation) throw new Error('La ecuación es obligatoria.');
  return {
    expression: equation,
    userId,
  };
}

export function parseUpdateEquationBody(body: unknown): UpdateEquationUserDto {
  const b = asObject(body);
  const data: UpdateEquationUserDto = {};

  if ('status' in b && b.status !== undefined) {
    if (typeof b.status !== 'string' || !VALID_STATUSES.has(b.status)) {
      throw new Error('Estado inválido.');
    }
    data.status = b.status as EquationStatus;
  }

  if ('isActive' in b && b.isActive !== undefined) {
    if (typeof b.isActive !== 'boolean') throw new Error('isActive inválido.');
    data.isActive = b.isActive;
  }

  if ('currentResolutionId' in b && b.currentResolutionId !== undefined) {
    if (
      typeof b.currentResolutionId !== 'number' ||
      !Number.isInteger(b.currentResolutionId) ||
      b.currentResolutionId < 0
    ) {
      throw new Error('currentResolutionId inválido.');
    }
    data.currentResolutionId = b.currentResolutionId;
  }

  if ('selectedBranch' in b && b.selectedBranch !== undefined) {
    if (typeof b.selectedBranch !== 'string') throw new Error('selectedBranch inválido.');
    data.selectedBranch = b.selectedBranch;
  }

  return data;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function isPermissionError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(PERMISSION_ERROR_KEYWORD);
}
