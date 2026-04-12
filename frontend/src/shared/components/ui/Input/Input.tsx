import { useState, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { COLORS } from '../../../../config/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  labelColor?: 'primary' | 'secondary';
  density?: 'md' | 'sm';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      labelColor = 'primary',
      density = 'md',
      className,
      type,
      ...props
    },
    ref
  ) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;
  const isDisabled = props.disabled;

  const sizeClasses = density === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-3';
  const inputClasses = `w-full ${sizeClasses} border-2 rounded-lg focus:outline-none focus:ring-2 ${
    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  }${className ? ` ${className}` : ''}`;
  const getLabelColor = () => {
    return labelColor === 'secondary' ? COLORS.gray[600] : COLORS.primary;
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-medium mb-1"
          style={{ color: getLabelColor() }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          style={{
            borderColor: error ? COLORS.error.main : isDisabled ? COLORS.gray[200] : COLORS.primary,
            '--tw-ring-color': COLORS.teal,
            paddingRight: isPasswordType ? '2.5rem' : undefined,
          } as React.CSSProperties}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || props.name}-error` : helperText ? `${props.id || props.name}-helper` : undefined}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-0"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {helperText && !error && (
        <p
          id={`${props.id || props.name}-helper`}
          className="mt-1 text-xs"
          style={{ color: COLORS.gray[500] }}
        >
          {helperText}
        </p>
      )}
      {error && (
        <p
          id={`${props.id || props.name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
  }
);
