import { API_URL } from '../../../config/constants';
import { apiFetch } from '../../../shared/utils/apiFetch';
import { getErrorMessageFromResponse } from '../../../shared/utils/httpErrorMessage';
import { buildAuthHeaders, type AuthContext } from './authContext';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ErrorStyle = 'rich' | 'simple';

export interface RequestJsonOptions {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  ctx?: AuthContext | null;
  fallbackErrorMessage: string;
  errorStyle?: ErrorStyle;
  treat404AsNull?: boolean;
}

const buildUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_URL}${path}`;

const readJsonSafely = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const extractErrorString = (body: unknown, fallback: string): string => {
  if (body && typeof body === 'object' && 'error' in body) {
    const value = (body as { error: unknown }).error;
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return fallback;
};

export async function requestJson<T>(
  options: RequestJsonOptions & { treat404AsNull: true }
): Promise<T | null>;
export async function requestJson<T>(options: RequestJsonOptions): Promise<T>;
export async function requestJson<T>(options: RequestJsonOptions): Promise<T | null> {
  const {
    path,
    method = 'GET',
    body,
    ctx,
    fallbackErrorMessage,
    errorStyle = 'rich',
    treat404AsNull = false,
  } = options;

  const response = await apiFetch(buildUrl(path), {
    method,
    headers: buildAuthHeaders(ctx ?? null),
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (treat404AsNull && response.status === 404) return null;

  if (errorStyle === 'simple') {
    const data = await readJsonSafely(response);
    if (!response.ok) {
      throw new Error(extractErrorString(data, fallbackErrorMessage));
    }
    return data as T;
  }

  if (!response.ok) {
    const message = await getErrorMessageFromResponse(response, fallbackErrorMessage);
    throw new Error(message);
  }

  return (await response.json()) as T;
}
