import type { ReactNode } from 'react';
import { COLORS, RADIUS, SHADOW } from '../../../../config/theme';

export interface FormPageCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'default' | 'wide' | 'full';
}

export const FormPageCard = ({ title, description, children, maxWidth = 'default' }: FormPageCardProps) => {
  const outerClass =
    maxWidth === 'full'
      ? 'w-full min-w-0 max-w-none'
      : `w-full min-w-0 ${maxWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto`;
  return (
    <div className={outerClass}>
      <div
        className="overflow-x-hidden rounded-2xl p-4 sm:p-8"
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
        <p
          className="mb-6 text-sm"
          style={{ color: COLORS.gray[600] }}
        >
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};
