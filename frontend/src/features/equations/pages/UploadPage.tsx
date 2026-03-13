import { EquationsLayout } from '../components/EquationsLayout';
import { FormPageCard } from '../components/FormPageCard';
import { FormMessage } from '../../../shared/components/ui/FormMessage';
import { UploadTabList } from '../components/UploadTabList';
import { UploadFormPanel } from '../components/UploadFormPanel';
import { UploadableEquationRow } from '../components/UploadableEquationRow';
import { useUploadForm } from '../hooks/useUploadForm';
import { COLORS } from '../../../config/theme';

export const UploadPage = () => {
  const {
    uploadableEquations,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    selectedIds,
    canUploadList,
    alreadyUploadedList,
    success,
    submitError,
    isSubmitting,
    handleToggle,
    handleSubmit,
  } = useUploadForm();

  return (
    <EquationsLayout>
      <div className="w-full flex-1 flex items-center justify-center">
        <FormPageCard
          title="Subir ecuación"
        description="Selecciona las ecuaciones creadas que quieras compartir con el resto de estudiantes. Cada ecuación solo puede subirse una vez."
      >
        {!isLoading && !error && uploadableEquations.length > 0 && (
          <UploadTabList
            activeTab={activeTab}
            onTabChange={setActiveTab}
            canUploadCount={canUploadList.length}
            alreadyUploadedCount={alreadyUploadedList.length}
          />
        )}

        {isLoading && (
          <p className="py-6 text-center text-sm" style={{ color: COLORS.gray[600] }}>
            Cargando ecuaciones...
          </p>
        )}

        {!isLoading && error && (
          <FormMessage message={error} variant="error" className="mb-4" />
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
          <UploadFormPanel
            canUploadList={canUploadList}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onSubmit={handleSubmit}
            success={success}
            submitError={submitError}
            isSubmitting={isSubmitting}
          />
        )}
        </FormPageCard>
      </div>
    </EquationsLayout>
  );
};
