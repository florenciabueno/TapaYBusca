import { getErrorMessage } from './getErrorMessage';

/**
 * Client-side validation wins over mutation error; otherwise maps `unknown` to a user-facing string.
 */
export function mergeFormSubmitError(
  validationError: string | null | undefined,
  mutationError: unknown,
  fallbackMessage: string
): string | null {
  if (validationError) return validationError;
  return getErrorMessage(mutationError, fallbackMessage);
}
