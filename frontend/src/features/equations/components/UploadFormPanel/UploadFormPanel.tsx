import { FormMessage } from '../../../../shared/components/ui/FormMessage';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { UploadableEquationRow } from '../UploadableEquationRow';
import { COLORS, SPACING } from '../../../../config/theme';
import type { UploadableEquation } from '../../types';

export interface UploadFormPanelProps {
  canUploadList: UploadableEquation[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  success: string | null;
  submitError: string | null;
  isSubmitting: boolean;
}

export const UploadFormPanel = ({
  canUploadList,
  selectedIds,
  onToggle,
  onSubmit,
  success,
  submitError,
  isSubmitting,
}: UploadFormPanelProps) => {
  return (
    <form
      id="tabpanel-can-upload"
      role="tabpanel"
      aria-labelledby="tab-can-upload"
      onSubmit={onSubmit}
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
              onToggle={onToggle}
            />
          ))
        )}
      </div>

      {success && (
        <FormMessage message={success} variant="success" className="mb-4" />
      )}

      {submitError && (
        <FormMessage message={submitError} variant="error" className="mb-4" />
      )}

      <Button
        type="submit"
        variant="accent"
        disabled={canUploadList.length === 0 || selectedIds.size === 0 || isSubmitting}
        isLoading={isSubmitting}
      >
        Subir selección
      </Button>
    </form>
  );
};
