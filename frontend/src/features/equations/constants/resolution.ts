/** API step status: single branch (no fork) for normal resolve / empty-set flows. */
export const RESOLUTION_NO_BRANCH_STEP = 1;

export const RESOLUTION_CODES = {
  STEP_CORRECT: 'PC',
  RESULT_CORRECT: 'RC',
  MORE_SOLUTIONS: 'MS',
  RESOLUTION_FINISHED: 'RT',
  STEP_INCORRECT: 'PI',
  RESULT_INCORRECT: 'RI',
  RESULT_REPEATED: 'RR',
  SYNTAX_INCORRECT: 'SI',
  NO_SOLUTION: 'SS',
  FIRST_WARNING: 'PA',
  STEP_REPEATED: 'PR',
} as const;

const CODE_MESSAGES: Record<string, string> = {
  [RESOLUTION_CODES.STEP_CORRECT]: 'Paso correcto.',
  [RESOLUTION_CODES.RESULT_CORRECT]: 'Existe otro número que también sirve.',
  [RESOLUTION_CODES.MORE_SOLUTIONS]: 'Hay más soluciones. Continúa desde la ecuación.',
  [RESOLUTION_CODES.RESOLUTION_FINISHED]: '¡Resolución terminada con éxito!',
  [RESOLUTION_CODES.NO_SOLUTION]: '¡No hay ningún número real que sirva!',
  [RESOLUTION_CODES.FIRST_WARNING]: '¿Mmm….Existirá algún número?',
  [RESOLUTION_CODES.RESULT_REPEATED]: 'Otro número, no el mismo.',
  [RESOLUTION_CODES.RESULT_INCORRECT]: '¿Mmm… ¿Estás segur@?',
  [RESOLUTION_CODES.STEP_INCORRECT]: 'El valor no es correcto para esta subecuación.',
  [RESOLUTION_CODES.SYNTAX_INCORRECT]: 'La subecuación seleccionada no es válida.',
  [RESOLUTION_CODES.STEP_REPEATED]: 'Ya ingresaste este paso.',
};

export function getResolutionFeedbackMessage(code: string): string | null {
  const msg = CODE_MESSAGES[code];
  return msg != null && msg !== '' ? msg : null;
}
