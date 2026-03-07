export interface ValidationResult<T = Record<string, string | undefined>> {
  isValid: boolean;
  errors: T;
}
