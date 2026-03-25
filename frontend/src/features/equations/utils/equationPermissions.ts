import type { Equation } from '../types/equation.types';
import type { User } from '../../../shared/types/user.types';

export function canDeleteEquation(equation: Equation, user: User | null): boolean {
  return !!user && equation.origin !== 'DEFAULT' && (equation.isActive ?? true);
}
