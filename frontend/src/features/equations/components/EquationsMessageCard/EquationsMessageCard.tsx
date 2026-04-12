import type { ReactNode } from 'react';
import { COLORS, SHADOW } from '../../../../config/theme';
import { Button } from '../../../../shared/components/ui/Button/Button';

export type EquationsMessageCardVariant = 'error' | 'info';

export interface EquationsMessageCardProps {
  variant: EquationsMessageCardVariant;
  message: ReactNode;
  onBack: () => void;
  backLabel?: string;
}

export const EquationsMessageCard = ({
  variant,
  message,
  onBack,
  backLabel = 'Volver al listado',
}: EquationsMessageCardProps) => {
  const isError = variant === 'error';

  return (
    <div className="w-full">
      <div
        className={
          isError
            ? 'rounded-lg border border-red-200 bg-red-50 p-4'
            : 'rounded-lg border p-4'
        }
        role={isError ? 'alert' : undefined}
        style={
          isError
            ? undefined
            : { borderColor: COLORS.brandDark, boxShadow: SHADOW.sm }
        }
      >
        <p className={`text-sm ${isError ? 'text-red-700' : 'text-gray-700'}`}>{message}</p>
        <Button type="button" variant="link" onClick={onBack} className="mt-2 self-start">
          {backLabel}
        </Button>
      </div>
    </div>
  );
};
