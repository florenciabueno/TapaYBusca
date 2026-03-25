export function getErrorMessage(error: unknown, fallback: string): string | null {
  if (error == null) return null;
  return error instanceof Error ? error.message : fallback;
}
