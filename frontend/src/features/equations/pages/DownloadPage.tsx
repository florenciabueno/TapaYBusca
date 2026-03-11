import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EquationsLayout } from '../components/EquationsLayout';
import { Input } from '../../../shared/components/ui/Input/Input';
import { Button } from '../../../shared/components/ui/Button/Button';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import { queryKeys } from '../../../shared/query-keys';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../../config/theme';

const QUANTITY_MIN = 1;
const QUANTITY_MAX = 50;
const SUCCESS_MESSAGE_DURATION_MS = 5000;

export const DownloadPage = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [quantity, setQuantity] = useState<string>(String(QUANTITY_MIN));
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);
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

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [success]);

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

  return (
    <EquationsLayout>
      <div className="max-w-3xl mx-auto">
        <div
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.xl,
            boxShadow: SHADOW.lg,
          }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: COLORS.accentSecondary }}
          >
            Descargar ecuaciones
          </h1>
          <p
            className="mb-6 text-sm"
            style={{ color: COLORS.gray[600] }}
          >
            Añade a &quot;Mis ecuaciones&quot; ecuaciones compartidas por otros estudiantes. Indica cuántas quieres y, si lo deseas, un intervalo de fechas (por fecha de publicación).
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: SPACING.lg }}>
              <Input
                label="Cantidad de ecuaciones"
                type="number"
                min={QUANTITY_MIN}
                max={QUANTITY_MAX}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`${QUANTITY_MIN} a ${QUANTITY_MAX}`}
                error={error}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: SPACING.lg }}>
              <Input
                label="Fecha desde (opcional)"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={isSubmitting}
                className="cursor-pointer"
              />
              <Input
                label="Fecha hasta (opcional)"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={isSubmitting}
                className="cursor-pointer"
              />
            </div>

            {success && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{ backgroundColor: COLORS.success.bg, color: COLORS.success.text }}
                role="status"
              >
                {success}
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Descargar ecuaciones
            </Button>
          </form>
        </div>
      </div>
    </EquationsLayout>
  );
};
