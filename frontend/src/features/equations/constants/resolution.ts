/** API step status: single branch (no fork) for normal resolve / empty-set flows. */
export const RESOLUTION_NO_BRANCH_STEP = 1;

export const RESOLUTION_CODES = {
  STEP_CORRECT: 'PC',
  RESULT_CORRECT: 'RC',
  MORE_SOLUTIONS: 'MS',
  PENDING_FINISH: 'PF',
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
  [RESOLUTION_CODES.RESULT_CORRECT]: 'Raíz correcta. Podés ingresar otra si aún falta.',
  [RESOLUTION_CODES.MORE_SOLUTIONS]:
    'Aún no registraste todas las raíces del conjunto solución. Seguí resolviendo e ingresalas como subecuación x antes de terminar.',
  [RESOLUTION_CODES.PENDING_FINISH]:
    'Ya tenés todas las raíces del conjunto solución. Pulsa «Terminar resolución» para cerrar.',
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
