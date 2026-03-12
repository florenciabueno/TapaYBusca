import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import { queryKeys } from '../../../shared/query-keys';
import { useDismissAfterDelay } from '../../../shared/hooks/useDismissAfterDelay';

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 50;
const SUCCESS_MESSAGE_DURATION_MS = 5000;

export function useDownloadForm() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [quantity, setQuantity] = useState<string>(String(QUANTITY_MIN));
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [success, setSuccess] = useDismissAfterDelay<string | null>(null, SUCCESS_MESSAGE_DURATION_MS);
  const [validationError, setValidationError] = useState<string | null>(null);

  const downloadMutation = useMutation({
    mutationFn: (params: { quantity: number; fromDate?: string; toDate?: string }) =>
      equationService.downloadEquations(params, token),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
      if (result.added === 0 && result.totalRequested > 0) {
        setSuccess('No se encontraron ecuaciones nuevas para añadir. Es posible que ya las tengas en tu listado.');
      } else {
        setSuccess(
          result.added < result.totalRequested
            ? `Se añadieron ${result.added} de ${result.totalRequested} ecuaciones a tu listado. Algunas ya estaban en tu listado.`
            : `Se añadieron ${result.added} ecuaciones a tu listado.`
        );
      }
    },
  });

  const isSubmitting = downloadMutation.isPending;
  const error =
    validationError ||
    (downloadMutation.error != null
      ? downloadMutation.error instanceof Error
        ? downloadMutation.error.message
        : 'Error al descargar ecuaciones'
      : null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    downloadMutation.reset();
    setSuccess(null);
    setValidationError(null);
    const num = parseInt(quantity, 10);
    if (Number.isNaN(num) || num < QUANTITY_MIN || num > QUANTITY_MAX) {
      setValidationError(`La cantidad debe estar entre ${QUANTITY_MIN} y ${QUANTITY_MAX}.`);
      return;
    }
    downloadMutation.mutate({
      quantity: num,
      fromDate: fromDate.trim() || undefined,
      toDate: toDate.trim() || undefined,
    });
  }

  return {
    quantity,
    setQuantity,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    success,
    error,
    isSubmitting,
    handleSubmit,
  };
}
