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

type UploadTab = 'can-upload' | 'already-uploaded';

export const UploadPage = () => {
  const token = useAuthStore((state) => state.token);
  const { uploadableEquations, isLoading, error, refetch } = useUploadableEquations();
  const [activeTab, setActiveTab] = useState<UploadTab>('can-upload');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canUploadList = uploadableEquations.filter((e) => !e.isPublished);
  const alreadyUploadedList = uploadableEquations.filter((e) => e.isPublished);

  const handleToggle = useCallback((id: string) => {
    const item = canUploadList.find((e) => e.id === id);
    if (item?.isPublished) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSubmitError(null);
  }, [canUploadList]);

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
            className="mb-4 text-sm"
            style={{ color: COLORS.gray[600] }}
          >
            Selecciona las ecuaciones creadas que quieras compartir con el resto de estudiantes. Cada ecuación solo puede subirse una vez.
          </p>

          {!isLoading && !error && uploadableEquations.length > 0 && (
            <div
              className="flex gap-1 rounded-lg p-1 mb-6"
              style={{ backgroundColor: COLORS.gray[100] }}
              role="tablist"
              aria-label="Pestañas de subir ecuación"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'can-upload'}
                aria-controls="tabpanel-can-upload"
                id="tab-can-upload"
                onClick={() => setActiveTab('can-upload')}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === 'can-upload' ? COLORS.surface : 'transparent',
                  color: activeTab === 'can-upload' ? COLORS.brandDark : COLORS.gray[600],
                  boxShadow: activeTab === 'can-upload' ? SHADOW.sm : 'none',
                }}
              >
                Ecuaciones para subir ({canUploadList.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'already-uploaded'}
                aria-controls="tabpanel-already-uploaded"
                id="tab-already-uploaded"
                onClick={() => setActiveTab('already-uploaded')}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === 'already-uploaded' ? COLORS.surface : 'transparent',
                  color: activeTab === 'already-uploaded' ? COLORS.brandDark : COLORS.gray[600],
                  boxShadow: activeTab === 'already-uploaded' ? SHADOW.sm : 'none',
                }}
              >
                Ya subidas ({alreadyUploadedList.length})
              </button>
            </div>
          )}

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

          {!isLoading && !error && uploadableEquations.length > 0 && activeTab === 'already-uploaded' && (
            <div
              id="tabpanel-already-uploaded"
              role="tabpanel"
              aria-labelledby="tab-already-uploaded"
              className="space-y-3"
            >
              {alreadyUploadedList.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: COLORS.gray[600] }}>
                  Aún no has subido ninguna ecuación.
                </p>
              ) : (
                alreadyUploadedList.map((item) => (
                  <UploadableEquationRow key={item.id} item={item} displayOnly />
                ))
              )}
            </div>
          )}

          {!isLoading && !error && uploadableEquations.length > 0 && activeTab === 'can-upload' && (
            <form
              id="tabpanel-can-upload"
              role="tabpanel"
              aria-labelledby="tab-can-upload"
              onSubmit={handleSubmit}
            >
              <div className="space-y-3" style={{ marginBottom: SPACING.lg }}>
                {canUploadList.length === 0 ? (
                  <p className="py-6 text-center text-sm" style={{ color: COLORS.gray[600] }}>
                    No tienes más ecuaciones por subir. Todas las creadas ya están compartidas.
                  </p>
                ) : (
                  canUploadList.map((item) => (
                    <UploadableEquationRow
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onToggle={handleToggle}
                    />
                  ))
                )}
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
                disabled={canUploadList.length === 0 || selectedIds.size === 0 || isSubmitting}
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
