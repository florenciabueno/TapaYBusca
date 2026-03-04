import { useCallback, useState } from 'react';
import { EquationsLayout } from '../components/EquationsLayout';
import { UploadableEquationRow } from '../components/UploadableEquationRow';
import { Button } from '../../../shared/components/ui/Button/Button';
import { useUploadableEquations } from '../hooks/useUploadableEquations';
import { equationService } from '../services/equation.service';
import { useAuthStore } from '../../../stores';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../../config/theme';

const UPLOAD_SUCCESS = 'Ecuaciones subidas correctamente. Se han compartido con el resto de estudiantes.';
const UPLOAD_SELECT_AT_LEAST_ONE = 'Selecciona al menos una ecuación para subir.';

export const UploadPage = () => {
  const token = useAuthStore((state) => state.token);
  const { uploadableEquations, isLoading, error, refetch } = useUploadableEquations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    const item = uploadableEquations.find((e) => e.id === id);
    if (item?.isPublished) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSubmitError(null);
  }, [uploadableEquations]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setSuccess(null);
      const ids = Array.from(selectedIds);
      if (ids.length === 0) {
        setSubmitError(UPLOAD_SELECT_AT_LEAST_ONE);
        return;
      }
      setIsSubmitting(true);
      try {
        await equationService.uploadEquations(ids, token);
        setSuccess(UPLOAD_SUCCESS);
        setSelectedIds(new Set());
        await refetch();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Error al subir ecuaciones');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedIds, token, refetch]
  );

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
            style={{ color: COLORS.brandDark }}
          >
            Subir ecuación
          </h1>
          <p
            className="mb-6 text-sm"
            style={{ color: COLORS.gray[600] }}
          >
            Selecciona las ecuaciones creadas que quieras compartir con el resto de estudiantes. Cada ecuación solo puede subirse una vez.
          </p>

          {isLoading && (
            <p className="py-6 text-center text-sm" style={{ color: COLORS.gray[600] }}>
              Cargando ecuaciones...
            </p>
          )}

          {!isLoading && error && (
            <div
              className="mb-4 rounded-lg p-3 text-sm"
              style={{ backgroundColor: COLORS.error.bg, color: COLORS.error.text }}
            >
              {error}
            </div>
          )}

          {!isLoading && !error && uploadableEquations.length === 0 && (
            <p className="py-6 text-center text-sm" style={{ color: COLORS.gray[600] }}>
              No tienes ecuaciones creadas para subir. Crea una ecuación primero.
            </p>
          )}

          {!isLoading && !error && uploadableEquations.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-3" style={{ marginBottom: SPACING.lg }}>
                {uploadableEquations.map((item) => (
                  <UploadableEquationRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={handleToggle}
                  />
                ))}
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

              {submitError && (
                <div
                  className="mb-4 rounded-lg p-3 text-sm"
                  style={{ backgroundColor: COLORS.error.bg, color: COLORS.error.text }}
                >
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={selectedIds.size === 0 || isSubmitting}
                isLoading={isSubmitting}
              >
                Subir selección
              </Button>
            </form>
          )}
        </div>
      </div>
    </EquationsLayout>
  );
};
