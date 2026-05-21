import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query-keys';
import { equationsApi } from '../api/equationsApi';
import { resolutionApi, type ResolveStepPayload } from '../api/resolutionApi';
import {
  deriveResolutionFeedbackMessage,
  RESOLUTION_CODES,
  RESOLUTION_NO_BRANCH_STEP,
} from '../constants/resolution';
import type {
  Equation,
  ResolutionActions,
  ResolutionFormState,
  ResolutionMutationStatus,
  ResolutionOutcome,
  ResolutionStep,
} from '../types';
import { useAuthContext } from './useAuthContext';
import { usePrefillResolutionInputs } from './usePrefillResolutionInputs';
import { useSyncGuestResolutionHistory } from './useSyncGuestResolutionHistory';

const readErrorMessage = (e: unknown, fallback: string): string =>
  e instanceof Error ? e.message : fallback;

export const useResolveEquation = (id?: string) => {
  const queryClient = useQueryClient();
  const { ctx, mode } = useAuthContext();

  const [subEquationInfix, setSubEquationInfix] = useState('');
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [finishedCode, setFinishedCode] = useState<string | null>(null);

  const equationQuery = useQuery({
    queryKey: queryKeys.equations.detail(id ?? '', mode),
    queryFn: () => equationsApi.getEquationById(id!, ctx),
    enabled: Boolean(id),
  });

  const resolutionQuery = useQuery({
    queryKey: queryKeys.equations.resolution(id ?? '', mode),
    queryFn: () => resolutionApi.getResolution(id!, ctx),
    enabled: Boolean(id),
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
    setFinishedCode(
      solutionSet.length === 0
        ? RESOLUTION_CODES.NO_SOLUTION
        : RESOLUTION_CODES.RESOLUTION_FINISHED
    );
  }, [equation?.id, equation?.status, solutionSet.length]);

  usePrefillResolutionInputs({
    id,
    equation,
    resolutionLoaded: resolutionQuery.isSuccess,
    resolutionStepCount: resolutionQuery.data?.steps?.length ?? 0,
    finished,
    setSubEquationInfix,
    setAnswer,
  });

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

  const markAsFinished = useCallback((code: string) => {
    setFinished(true);
    setFinishedCode(code);
    setSubEquationInfix('');
    setAnswer('');
  }, []);

  const resolveStepMutation = useMutation({
    mutationFn: (payload: ResolveStepPayload) => resolutionApi.resolveStep(id!, payload, ctx),
    onSuccess: async (result) => {
      setMessage(deriveResolutionFeedbackMessage(result));
      await invalidateEquationQueries();
    },
  });

  const resetResolutionMutation = useMutation({
    mutationFn: () => resolutionApi.resetResolution(id!, ctx),
    onSuccess: async () => {
      clearResolutionFormState();
      await invalidateEquationQueries();
    },
    onError: (e: unknown) => {
      setMessage(readErrorMessage(e, 'Error al reiniciar'));
    },
  });

  const finishResolutionMutation = useMutation({
    mutationFn: () => resolutionApi.finishResolution(id!, ctx),
  });

  const handleValidate = async () => {
    if (!id) return;
    setMessage(null);
    try {
      const result = await resolveStepMutation.mutateAsync({
        subEquationInfix: subEquationInfix.trim() || undefined,
        answer: answer.trim(),
        resolutionStepStatus: RESOLUTION_NO_BRANCH_STEP,
      });
      if (
        result.code === RESOLUTION_CODES.RESOLUTION_FINISHED ||
        result.code === RESOLUTION_CODES.NO_SOLUTION
      ) {
        markAsFinished(result.code);
      }
    } catch (e) {
      setMessage(readErrorMessage(e, 'Error al validar'));
    }
  };

  const handleReset = async () => {
    if (!id) return;
    setMessage(null);
    try {
      await resetResolutionMutation.mutateAsync();
    } catch (e) {
      setMessage(readErrorMessage(e, 'Error al reiniciar'));
    }
  };

  const handleFinishResolution = async () => {
    if (!id) return;
    setMessage(null);
    try {
      const result = await finishResolutionMutation.mutateAsync();
      setMessage(deriveResolutionFeedbackMessage(result));
      await invalidateEquationQueries();
      if (result.code === RESOLUTION_CODES.RESOLUTION_FINISHED) {
        markAsFinished(RESOLUTION_CODES.RESOLUTION_FINISHED);
      }
    } catch (e) {
      setMessage(readErrorMessage(e, 'Error al finalizar'));
    }
  };

  useSyncGuestResolutionHistory({
    id,
    mode,
    steps,
    solutionSet,
    finished,
    finishedCode,
    resolutionData: resolutionQuery.data,
  });

  const resolveStepPending = resolveStepMutation.isPending;
  const finishResolutionPending = finishResolutionMutation.isPending;
  const submitting =
    resolveStepPending || resetResolutionMutation.isPending || finishResolutionPending;
  const loading = Boolean(id) && (equationQuery.isLoading || resolutionQuery.isLoading);
  const error =
    equationQuery.error instanceof Error
      ? equationQuery.error.message
      : resolutionQuery.error instanceof Error
        ? resolutionQuery.error.message
        : null;

  const form: ResolutionFormState = { subEquationInfix, answer, message };
  const status: ResolutionMutationStatus = {
    submitting,
    resolveStepPending,
    finishResolutionPending,
  };
  const outcome: ResolutionOutcome = { finished, finishedCode };
  const actions: ResolutionActions = {
    onSubEquationChange: setSubEquationInfix,
    onAnswerChange: setAnswer,
    onValidate: handleValidate,
    onFinishResolution: handleFinishResolution,
    onReset: handleReset,
  };

  return {
    equation,
    steps,
    solutionSet,
    loading,
    error,
    form,
    status,
    outcome,
    actions,
  };
};
