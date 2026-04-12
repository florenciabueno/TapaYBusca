export async function getErrorMessageFromResponse(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data: unknown = await response.json();
      if (
        data != null &&
        typeof data === 'object' &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'string'
      ) {
        const msg = (data as { error: string }).error.trim();
        if (msg.length > 0) return msg;
      }
    }
  } catch {
      // body empty or not JSON
  }

  if (response.status === 401) {
    return 'Sesión no válida o expirada. Vuelve a iniciar sesión.';
  }
  if (response.status === 403) {
    return 'No tienes permiso para esta acción.';
  }
  if (response.status >= 500) {
    return 'Error del servidor. Intenta más tarde.';
  }

  return fallback;
}
