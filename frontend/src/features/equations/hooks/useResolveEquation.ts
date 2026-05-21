import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { useAuthStore } from '../../../stores';
import {
  getResolutionFeedbackMessage,
  RESOLUTION_CODES,
  RESOLUTION_NO_BRANCH_STEP,
} from '../constants/resolution';
import { equationService } from '../services/equation.service';
import {
  clearGuestResolutionHistory,
  getOrCreateGuestSessionId,
  upsertGuestResolutionHistory,
} from '../storage/guestResolutionHistory.storage';
import type { Equation, ResolutionStep } from '../types';
import { infixToUserFacingForInput, splitInfixAtEquals } from '../utils/equation-input-guards';

export const useResolveEquation = (id?: string) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const mode = token ? 'auth' : 'guest';
  const guestSessionId = useMemo(() => getOrCreateGuestSessionId(), []);

  const [subEquationInfix, setSubEquationInfix] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishedCode, setFinishedCode] = useState<string | null>(null);

  const equationQuery = useQuery({
    queryKey: queryKeys.equations.detail(id ?? '', mode),
    queryFn: () =>
      token
        ? equationService.getEquationById(id!, token)
        : equationService.getGuestEquationById(id!, guestSessionId),
    enabled: Boolean(id),
  });

  const resolutionQuery = useQuery({
    queryKey: queryKeys.equations.resolution(id ?? '', mode),
    queryFn: () =>
      token
        ? equationService.getResolution(id!, token)
        : equationService.getGuestResolution(id!, guestSessionId),
    enabled: Boolean(id),
  });

  const equation: Equation | null = equationQuery.data ?? null;
  const steps: ResolutionStep[] = resolutionQuery.data?.steps ?? [];
  const solutionSet: number[] = resolutionQuery.data?.solutionSet ?? [];
  const queriesEnabled = Boolean(id);

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

  useEffect(() => {
    if (!queriesEnabled || !id) return;
    if (!equation || equation.id !== id) return;
    if (!equation.infixExpression?.trim()) return;
    if (!resolutionQuery.isSuccess) return;
    if (equation.status !== 'NOT_STARTED') return;
    if (finished) return;
    const stepCount = resolutionQuery.data?.steps?.length ?? 0;
    if (stepCount > 0) return;

    const userFacing = infixToUserFacingForInput(equation.infixExpression);
    const parts = splitInfixAtEquals(userFacing);
    if (!parts) return;
    const [left, right] = parts;
    setSubEquationInfix(left);
    setAnswer(right);
  }, [
    id,
    queriesEnabled,
    equation?.id,
    equation?.infixExpression,
    equation?.status,
    resolutionQuery.isSuccess,
    resolutionQuery.data?.steps?.length,
    finished,
  ]);


  const invalidateEquationQueries = useCallback(async () => {
    if (!id) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.equations.detail(id, mode) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.equations.resolution(id, mode) });
    queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
  }, [id, mode, queryClient]);

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
    }) =>
      token
        ? equationService.resolveStep(id!, payload, token)
        : equationService.guestResolveStep(id!, payload, guestSessionId),
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
    mutationFn: () =>
      token
        ? equationService.resetResolution(id!, token)
        : equationService.guestResetResolution(id!, guestSessionId),
    onSuccess: async () => {
      clearResolutionFormState();
      await invalidateEquationQueries();
    },
    onError: (e: unknown) => {
      setMessage(e instanceof Error ? e.message : 'Error al reiniciar');
    },
  });

  const finishResolutionMutation = useMutation({
    mutationFn: () =>
      token
        ? equationService.finishResolution(id!, token)
        : equationService.guestFinishResolution(id!, guestSessionId),
  });

  const resolveStepPending = resolveStepMutation.isPending;
  const finishResolutionPending = finishResolutionMutation.isPending;
  const submitting =
    resolveStepPending || resetResolutionMutation.isPending || finishResolutionPending;
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
      setSubEquationInfix('');
      setAnswer('');
      return;
    }
  };

  const handleValidate = async () => {
    if (!id) return;
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

  const handleReset = async () => {
    if (!id) return;
    setMessage(null);
    try {
      await resetResolutionMutation.mutateAsync();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al reiniciar');
    }
  };

  const handleFinishResolution = async () => {
    if (!id) return;
    setMessage(null);
    try {
      const result = await finishResolutionMutation.mutateAsync();
      const fallback = getResolutionFeedbackMessage(result.code);
      const text =
        result.code === RESOLUTION_CODES.SYNTAX_INCORRECT && result.message?.trim()
          ? result.message.trim()
          : fallback;
      setMessage(text ?? null);
      await invalidateEquationQueries();
      if (result.code === RESOLUTION_CODES.RESOLUTION_FINISHED) {
        setFinished(true);
        setFinishedCode(RESOLUTION_CODES.RESOLUTION_FINISHED);
        setSubEquationInfix('');
        setAnswer('');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error al finalizar');
    }
  };

  useEffect(() => {
    if (!id || token) return;
    upsertGuestResolutionHistory({
      equationId: id,
      steps,
      solutionSet,
      updatedAt: new Date().toISOString(),
      finished,
      finishedCode,
    });
  }, [finished, finishedCode, id, solutionSet, steps, token]);

  useEffect(() => {
    if (!id || token || !resolutionQuery.data) return;
    if ((resolutionQuery.data.steps?.length ?? 0) === 0) {
      clearGuestResolutionHistory(id);
    }
  }, [id, resolutionQuery.data, token]);

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
    resolveStepPending,
    finishResolutionPending,
    message,
    finished,
    finishedCode,
    setSubEquationInfix,
    setAnswer,
    handleValidate,
    handleFinishResolution,
    handleReset,
  };
};
