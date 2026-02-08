import type { ButtonHTMLAttributes, ReactNode } from 'react';

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
    : isDisabled ? '#629FAD' : variant === 'primary' ? '#0C2C55' : '#629FAD';
  const borderColor = variant === 'outline' ? '#0C2C55' : variant === 'outlineSuccess' ? '#22C55E' : undefined;
  const textColor = variant === 'outline' ? '#0C2C55' : variant === 'outlineSuccess' ? '#22C55E' : 'white';
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
