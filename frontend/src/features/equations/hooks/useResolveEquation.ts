import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import {
  getResolutionFeedbackMessage,
  RESOLUTION_CODES,
  RESOLUTION_NO_BRANCH_STEP,
} from '../constants/resolution';
import { equationService } from '../services/equation.service';
import type { Equation, ResolutionStep } from '../types';

export const useResolveEquation = (id?: string) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [subEquationInfix, setSubEquationInfix] = useState('');
  const [answer, setAnswer] = useState('');
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
  }, []);

  const resolveStepMutation = useMutation({
    mutationFn: (payload: {
      subEquationInfix: string | undefined;
      answer: string;
      resolutionStepStatus: number;
    }) => equationService.resolveStep(id!, payload, token),
    onSuccess: async (result) => {
      const fallback = getResolutionFeedbackMessage(result.code);
      const text =
        result.code === RESOLUTION_CODES.SYNTAX_INCORRECT && result.message?.trim()
          ? result.message.trim()
          : fallback;
      setMessage(text);
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
        resolutionStepStatus: RESOLUTION_NO_BRANCH_STEP,
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
        resolutionStepStatus: RESOLUTION_NO_BRANCH_STEP,
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
