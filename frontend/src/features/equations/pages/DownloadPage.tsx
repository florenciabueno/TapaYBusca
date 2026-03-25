import { EquationsLayout } from '../components/EquationsLayout';
import { FormPageCard } from '../components/FormPageCard';
import { FormMessage } from '../../../shared/components/ui/FormMessage';
import { Input } from '../../../shared/components/ui/Input/Input';
import { Button } from '../../../shared/components/ui/Button/Button';
import { useDownloadForm, QUANTITY_MIN, QUANTITY_MAX } from '../hooks/useDownloadForm';
import { SPACING } from '../../../config/theme';

export const DownloadPage = () => {
  const {
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
  } = useDownloadForm();

  return (
    <EquationsLayout>
      <div className="w-full flex-1 flex items-center justify-center">
        <FormPageCard
          title="Descargar ecuaciones"
        description='Añade a "Mis ecuaciones" ecuaciones compartidas por otros estudiantes. Indica cuántas quieres y, si lo deseas, un intervalo de fechas (por fecha de publicación).'
      >
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
            <FormMessage message={success} variant="success" className="mb-4" />
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
        </FormPageCard>
      </div>
    </EquationsLayout>
  );
};
