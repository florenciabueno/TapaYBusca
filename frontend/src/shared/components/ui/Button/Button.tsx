import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { COLORS } from '../../../../config/theme';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'outlineSuccess';
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
  const backgroundColor = isOutline 
    ? 'transparent' 
    : isDisabled ? COLORS.accent : variant === 'primary' ? COLORS.primary : COLORS.accent;
  const borderColor = variant === 'outline' ? COLORS.primary : variant === 'outlineSuccess' ? COLORS.success.main : undefined;
  const textColor = variant === 'outline' ? COLORS.primary : variant === 'outlineSuccess' ? COLORS.success.main : 'white';
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
