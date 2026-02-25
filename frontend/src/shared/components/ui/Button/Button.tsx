import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { COLORS } from '../../../../config/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'light' | 'outline' | 'outlineSuccess';
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
  const baseClasses = 'px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const isDisabled = disabled || isLoading;
  const isOutline = variant === 'outline' || variant === 'outlineSuccess';
  
  const getBackgroundColor = () => {
    if (isOutline) return 'transparent';
    if (isDisabled) return COLORS.accent;
    if (variant === 'primary') return COLORS.primary;
    if (variant === 'light') return COLORS.light;
    return COLORS.accent;
  };
  
  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    if (variant === 'outlineSuccess') return COLORS.success.main;
    if (variant === 'light') return COLORS.secondary;
    return 'white';
  };
  
  const backgroundColor = getBackgroundColor();
  const borderColor = variant === 'outline' ? COLORS.primary : variant === 'outlineSuccess' ? COLORS.success.main : undefined;
  const textColor = getTextColor();
  const opacity = isDisabled && variant === 'secondary' ? 0.5 : undefined;

  return (
    <button
      className={className ? `${baseClasses} ${className}` : baseClasses}
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
