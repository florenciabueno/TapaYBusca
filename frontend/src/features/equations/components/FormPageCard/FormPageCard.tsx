import type { ReactNode } from 'react';
import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';

export interface FormPageCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Use 'wide' for resolve page to fit two-column layout (equation + steps | form). */
  maxWidth?: 'default' | 'wide';
}

export const FormPageCard = ({ title, description, children, maxWidth = 'default' }: FormPageCardProps) => {
  const maxWidthClass = maxWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl';
  return (
    <div className={`${maxWidthClass} mx-auto`}>
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
          {title}
        </h1>
        {description != null && description !== '' && (
          <p
            className="mb-6 text-sm"
            style={{ color: COLORS.gray[600] }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};
