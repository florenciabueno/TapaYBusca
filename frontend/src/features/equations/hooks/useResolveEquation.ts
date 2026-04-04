import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import { equationService } from '../services/equation.service';
import type { Equation, ResolutionStep } from '../types';

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

const getUserMessage = (code: string): string | null => {
  const msg = CODE_MESSAGES[code];
  return msg != null && msg !== '' ? msg : null;
};

export const useResolveEquation = (id?: string) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [subEquationInfix, setSubEquationInfix] = useState('');
  const [answer, setAnswer] = useState('');
  const [stepStatus, setStepStatus] = useState(NO_BRANCH_STEP);
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishedCode, setFinishedCode] = useState<string | null>(null);

  const equationQuery = useQuery({
    queryKey: queryKeys.equations.detail(id ?? ''),
    queryFn: () => equationService.getEquationById(id!, token),
    enabled: Boolean(id && token),
  });

  const resolutionQuery = useQuery({
    queryKey: queryKeys.equations.resolution(id ?? ''),
    queryFn: () => equationService.getResolution(id!, token),
    enabled: Boolean(id && token),
  });

  const equation: Equation | null = equationQuery.data ?? null;
  const steps: ResolutionStep[] = resolutionQuery.data?.steps ?? [];
  const solutionSet: number[] = resolutionQuery.data?.solutionSet ?? [];

  useEffect(() => {
    setSubEquationInfix('');
    setAnswer('');
    setStepStatus(NO_BRANCH_STEP);
    setMessage(null);
    setFinished(false);
    setFinishedCode(null);
  }, [id]);

  useEffect(() => {
    if (!equation || equation.status !== 'SOLVED') return;
    setFinished(true);
    const emptySolution = solutionSet.length === 0;
    setFinishedCode(
      emptySolution ? RESOLUTION_CODES.NO_SOLUTION : RESOLUTION_CODES.RESOLUTION_FINISHED
    );
  }, [equation?.id, equation?.status, solutionSet.length]);

  const invalidateEquationQueries = useCallback(async () => {
    if (!id) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.equations.detail(id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.equations.resolution(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
  }, [id, queryClient]);

  const clearResolutionFormState = useCallback(() => {
    setFinished(false);
    setFinishedCode(null);
    setMessage(null);
    setSubEquationInfix('');
    setAnswer('');
    setStepStatus(NO_BRANCH_STEP);
  }, []);

  const resolveStepMutation = useMutation({
    mutationFn: (payload: {
      subEquationInfix: string | undefined;
      answer: string;
      resolutionStepStatus: number;
    }) => equationService.resolveStep(id!, payload, token),
    onSuccess: async (result) => {
      setMessage(getUserMessage(result.code));
      await invalidateEquationQueries();
    },
  });

  const resetResolutionMutation = useMutation({
    mutationFn: () => equationService.resetResolution(id!, token),
    onSuccess: async () => {
      clearResolutionFormState();
      await invalidateEquationQueries();
    },
    onError: (e: unknown) => {
      setMessage(e instanceof Error ? e.message : 'Error al reiniciar');
    },
  });

  const submitting = resolveStepMutation.isPending || resetResolutionMutation.isPending;
  const queriesEnabled = Boolean(id && token);
  const loading =
    queriesEnabled && (equationQuery.isLoading || resolutionQuery.isLoading);
  const error =
    equationQuery.error instanceof Error
      ? equationQuery.error.message
      : resolutionQuery.error instanceof Error
        ? resolutionQuery.error.message
        : null;

  const applyResolveResult = (code: string) => {
    if (code === RESOLUTION_CODES.RESOLUTION_FINISHED || code === RESOLUTION_CODES.NO_SOLUTION) {
      setFinished(true);
      setFinishedCode(code);
    }
    if (code === RESOLUTION_CODES.RESULT_CORRECT) {
      setSubEquationInfix('x');
      setAnswer('');
    } else {
      setSubEquationInfix('');
      setAnswer('');
    }
  };

  const handleValidate = async () => {
    if (!id || !token) return;
    setMessage(null);
    try {
      const result = await resolveStepMutation.mutateAsync({
        subEquationInfix: subEquationInfix.trim() || undefined,
        answer: answer.trim(),
        resolutionStepStatus: stepStatus,
      });
      applyResolveResult(result.code);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al validar');
    }
  };

  const handleEmptySet = async () => {
    if (!id || !token) return;
    setMessage(null);
    try {
      const result = await resolveStepMutation.mutateAsync({
        subEquationInfix: subEquationInfix.trim() || undefined,
        answer: '{}',
        resolutionStepStatus: NO_BRANCH_STEP,
      });
      if (result.code === RESOLUTION_CODES.RESOLUTION_FINISHED) {
        setFinished(true);
        setFinishedCode(result.code);
      }
      setSubEquationInfix('');
      setAnswer('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al validar');
    }
  };

  const handleReset = async () => {
    if (!id || !token) return;
    setMessage(null);
    try {
      await resetResolutionMutation.mutateAsync();
    } catch {
      /* message set in onError */
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
    handleValidate,
    handleEmptySet,
    handleReset,
  };
};
