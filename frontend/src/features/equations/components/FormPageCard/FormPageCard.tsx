import type { ReactNode } from 'react';
import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';

export interface FormPageCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const FormPageCard = ({ title, description, children }: FormPageCardProps) => {
  return (
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
