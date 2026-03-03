import { EMAIL_INVALID_MESSAGE } from '../constants/validation.js';

export function validateEmail(email: string | undefined): string | undefined {
  if (!email || !email.includes('@')) return EMAIL_INVALID_MESSAGE;
  return undefined;
}
