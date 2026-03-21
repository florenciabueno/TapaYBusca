import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import { equationService } from '../services/equation.service';
import type { Equation } from '../types';

const NO_BRANCH_STEP = 1;

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

export interface ResolutionStep {
  subEquation: string;
  proposedResult: string;
  isCorrect: boolean;
  subEquationLatex?: string;
  resultLatex?: string;
}

function getUserMessage(code: string): string | null {
  const msg = CODE_MESSAGES[code];
  return msg != null && msg !== '' ? msg : null;
}

export const useResolveEquation = (id?: string) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [equation, setEquation] = useState<Equation | null>(null);
  const [steps, setSteps] = useState<ResolutionStep[]>([]);
  const [solutionSet, setSolutionSet] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subEquationInfix, setSubEquationInfix] = useState('');
  const [answer, setAnswer] = useState('');
  const [stepStatus, setStepStatus] = useState(NO_BRANCH_STEP);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishedCode, setFinishedCode] = useState<string | null>(null);
  const activeInputRef = useRef<'subEquation' | 'answer'>('subEquation');

  const loadResolution = async (userEquationId: string, authToken?: string | null) => {
    const resolution = authToken
      ? await equationService.getResolution(userEquationId, authToken)
      : null;
    if (!resolution) return null;
    setSteps(resolution.steps ?? []);
    setSolutionSet(resolution.solutionSet ?? []);
    return resolution;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      equationService.getEquationById(id, token),
      loadResolution(id, token),
    ])
      .then(([eq, resolution]) => {
        setEquation(eq);
        if (eq.status === 'SOLVED') {
          setFinished(true);
          const emptySolution = (resolution?.solutionSet?.length ?? 0) === 0;
          setFinishedCode(
            emptySolution ? RESOLUTION_CODES.NO_SOLUTION : RESOLUTION_CODES.RESOLUTION_FINISHED
          );
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleSymbolClick = (insert: string) => {
    if (activeInputRef.current === 'subEquation') {
      setSubEquationInfix((prev) => prev + insert);
    } else {
      setAnswer((prev) => prev + insert);
    }
  };

  const handleValidate = async () => {
    if (!id || !token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await equationService.resolveStep(
        id,
        {
          subEquationInfix: subEquationInfix.trim() || undefined,
          answer: answer.trim(),
          resolutionStepStatus: stepStatus,
        },
        token
      );
      await loadResolution(id, token);
      setMessage(getUserMessage(result.code));
      if (
        result.code === RESOLUTION_CODES.RESOLUTION_FINISHED ||
        result.code === RESOLUTION_CODES.NO_SOLUTION
      ) {
        setFinished(true);
        setFinishedCode(result.code);
        queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
      }
      if (result.code === RESOLUTION_CODES.RESULT_CORRECT) {
        setSubEquationInfix('x');
        setAnswer('');
      } else {
        setSubEquationInfix('');
        setAnswer('');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al validar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmptySet = async () => {
    if (!id || !token) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await equationService.resolveStep(
        id,
        {
          subEquationInfix: subEquationInfix.trim() || undefined,
          answer: '{}',
          resolutionStepStatus: NO_BRANCH_STEP,
        },
        token
      );
      await loadResolution(id, token);
      setMessage(getUserMessage(result.code));
      if (result.code === RESOLUTION_CODES.RESOLUTION_FINISHED) {
        setFinished(true);
        setFinishedCode(result.code);
        queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
      }
      setSubEquationInfix('');
      setAnswer('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al validar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!id || !token) return;
    try {
      await equationService.resetResolution(id, token);
      setSteps([]);
      setSolutionSet([]);
      setFinished(false);
      setFinishedCode(null);
      setMessage(null);
      setSubEquationInfix('');
      setAnswer('');
      setStepStatus(NO_BRANCH_STEP);
      await loadResolution(id, token);
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al reiniciar');
    }
  };

  return {
    token,
    equation,
    steps,
    solutionSet,
    loading,
    error,
    subEquationInfix,
    answer,
    submitting,
    message,
    finished,
    finishedCode,
    setSubEquationInfix,
    setAnswer,
    setActiveInput: (value: 'subEquation' | 'answer') => {
      activeInputRef.current = value;
    },
    handleSymbolClick,
    handleValidate,
    handleEmptySet,
    handleReset,
  };
};
