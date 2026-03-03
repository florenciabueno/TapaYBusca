/**
 * Types for the expression tree and solver result.
 */

export type NodeType = 'NUMBER' | 'VARIABLE' | 'OPERATOR_BINARY' | 'OPERATOR_UNARY';

export interface TreeNode {
  type: NodeType;
  value: string;
  left?: TreeNode | null;
  right?: TreeNode | null;
}

export interface SolveResult {
  ok: boolean;
  solutions?: number[];
  errorCode?: string;
  message?: string;
}

export const ERROR_CODES = {
  MISSING_PARENTHESES: 'MISSING_PARENTHESES',
  MALFORMED_EQUATION: 'MALFORMED_EQUATION',
  INFINITE_RESULT: 'INFINITE_RESULT',
  NO_SOLUTION: 'NO_SOLUTION',
} as const;

/** User-facing messages (Spanish) for API responses. */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.MISSING_PARENTHESES]: 'Paréntesis desbalanceados.',
  [ERROR_CODES.MALFORMED_EQUATION]: 'La ecuación está mal formada o no pudo resolverse.',
  [ERROR_CODES.INFINITE_RESULT]: 'La ecuación produce un resultado no válido (infinito o indeterminado).',
  [ERROR_CODES.NO_SOLUTION]: 'La ecuación no tiene solución real.',
};
