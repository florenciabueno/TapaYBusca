export interface UpdateProfileDto {
  name?: string;
  currentPassword?: string;
  password?: string;
}

export interface UserUpdatePayload {
  name?: string;
  passwordHash?: string;
}

export type UpdateProfileValidationErrors = Partial<Record<keyof UpdateProfileDto, string>>;

export interface ValidationResult<T = Record<string, string | undefined>> {
  isValid: boolean;
  errors: T;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
}
