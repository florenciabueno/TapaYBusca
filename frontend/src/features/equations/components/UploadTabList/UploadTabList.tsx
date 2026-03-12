import { COLORS, SHADOW } from '../../../../config/theme';
import type { UploadTab } from '../../hooks/useUploadForm';

export interface UploadTabListProps {
  activeTab: UploadTab;
  onTabChange: (tab: UploadTab) => void;
  canUploadCount: number;
  alreadyUploadedCount: number;
}

export const UploadTabList = ({
  activeTab,
  onTabChange,
  canUploadCount,
  alreadyUploadedCount,
}: UploadTabListProps) => {
  return (
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
        onClick={() => onTabChange('can-upload')}
        className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: activeTab === 'can-upload' ? COLORS.surface : 'transparent',
          color: activeTab === 'can-upload' ? COLORS.brandDark : COLORS.gray[600],
          boxShadow: activeTab === 'can-upload' ? SHADOW.sm : 'none',
        }}
      >
        Ecuaciones para subir ({canUploadCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'already-uploaded'}
        aria-controls="tabpanel-already-uploaded"
        id="tab-already-uploaded"
        onClick={() => onTabChange('already-uploaded')}
        className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: activeTab === 'already-uploaded' ? COLORS.surface : 'transparent',
          color: activeTab === 'already-uploaded' ? COLORS.brandDark : COLORS.gray[600],
          boxShadow: activeTab === 'already-uploaded' ? SHADOW.sm : 'none',
        }}
      >
        Ya subidas ({alreadyUploadedCount})
      </button>
    </div>
  );
};
