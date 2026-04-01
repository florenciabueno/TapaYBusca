import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { COLORS } from '../../../../config/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'light' | 'outline' | 'outlineSuccess' | 'accent' | 'link';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;
  const isLink = variant === 'link';
  const isOutline = variant === 'outline' || variant === 'outlineSuccess';
  const baseClasses = isLink
    ? 'cursor-pointer inline-flex items-center px-0 py-0 text-sm font-medium underline underline-offset-2 rounded border-0 shadow-none bg-transparent transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600'
    : 'cursor-pointer px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const hoverClass =
    isLink && !isDisabled ? 'hover:opacity-80' : !isOutline && !isDisabled && !isLink ? 'hover:brightness-95' : '';

  const getBackgroundColor = () => {
    if (isLink || isOutline) return 'transparent';
    if (isDisabled && !isLoading) return COLORS.gray[300];
    if (variant === 'accent') return COLORS.orange;
    if (variant === 'primary') return COLORS.primary;
    if (variant === 'secondary') return COLORS.secondary;
    if (variant === 'light') return COLORS.gray[100];
    return COLORS.gray[800];
  };

  const getTextColor = () => {
    if (variant === 'link') return isDisabled ? COLORS.gray[500] : COLORS.brandDark;
    if (variant === 'outlineSuccess') return COLORS.success.main;
    if (isOutline) return COLORS.primary;
    if (variant === 'light') return COLORS.gray[700];
    if (variant === 'secondary') return 'white';
    return 'white';
  };
  
  const backgroundColor = getBackgroundColor();
  const borderColor = variant === 'outline' ? COLORS.primary : variant === 'outlineSuccess' ? COLORS.success.main : undefined;
  const textColor = getTextColor();
  const opacity =
    isDisabled && variant === 'secondary'
      ? 0.5
      : isLoading && (variant === 'accent' || variant === 'primary' || variant === 'secondary')
        ? 0.82
        : undefined;

  return (
    <button
      className={[baseClasses, hoverClass, className].filter(Boolean).join(' ')}
      style={{ backgroundColor, border: borderColor ? `2px solid ${borderColor}` : undefined, color: textColor, opacity }}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="60"
              strokeDashoffset="45"
              className="opacity-75"
            />
          </svg>
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
