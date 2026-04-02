import { ROUTES } from '../../config/constants';
import { useAuthStore } from '../../stores';

function requestIncludesBearerToken(init?: RequestInit): boolean {
  if (!init?.headers) return false;
  const h = init.headers;
  if (h instanceof Headers) {
    const value = h.get('Authorization');
    return typeof value === 'string' && value.startsWith('Bearer ');
  }
  if (Array.isArray(h)) {
    return h.some(
      ([key, value]) =>
        key.toLowerCase() === 'authorization' &&
        typeof value === 'string' &&
        value.startsWith('Bearer ')
    );
  }
  const record = h as Record<string, string>;
  const value = record.Authorization ?? record.authorization;
  return typeof value === 'string' && value.startsWith('Bearer ');
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && requestIncludesBearerToken(init)) {
    useAuthStore.getState().logout();
    window.location.assign(ROUTES.LOGIN);
    throw new Error('Sesión finalizada');
  }
  return response;
}
