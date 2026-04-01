import type { Request } from 'express';
import {
  DownloadEquationsDto,
  EquationOrigin,
  EquationStatus,
  ResolveStepDto,
} from './equation.types.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../shared/constants/pagination.js';

const VALID_ORIGINS = new Set<string>(Object.values(EquationOrigin));
const VALID_STATUSES = new Set<string>(Object.values(EquationStatus));
const LIST_STATUS_DELETED = 'DELETED';
const PERMISSION_ERROR_KEYWORD = 'permisos';

type QueryParams = Request['query'];

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
  if (body == null || typeof body !== 'object') return [];
  const arr = (body as Record<string, unknown>).userEquationIds;
  if (!Array.isArray(arr)) return [];
  return arr.filter((id): id is string => typeof id === 'string');
}

export function parseDownloadBody(body: unknown): DownloadEquationsDto {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return {
    quantity: typeof b.quantity === 'number' ? b.quantity : parseInt(String(b.quantity ?? 0), 10),
    fromDate: typeof b.fromDate === 'string' ? b.fromDate : undefined,
    toDate: typeof b.toDate === 'string' ? b.toDate : undefined,
  };
}

export function parseResolveStepBody(body: unknown): ResolveStepDto {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const subEquationPostfix = Array.isArray(b.subEquationPostfix)
    ? (b.subEquationPostfix as string[])
    : undefined;
  const subEquationInfix = typeof b.subEquationInfix === 'string' ? b.subEquationInfix : undefined;
  const answer = typeof b.answer === 'string' ? b.answer : '';
  const resolutionStepStatus =
    typeof b.resolutionStepStatus === 'number' ? b.resolutionStepStatus : undefined;

  return {
    subEquationPostfix,
    subEquationInfix,
    answer,
    resolutionStepStatus: resolutionStepStatus ?? 1,
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function isPermissionError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(PERMISSION_ERROR_KEYWORD);
}
