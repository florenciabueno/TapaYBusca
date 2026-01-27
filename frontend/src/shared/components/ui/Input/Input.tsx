import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-4 py-3 border-2 rounded-lg bg-white
      focus:outline-none focus:ring-2
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {label && (
          <label 
            className="block text-sm font-medium mb-1"
            style={{ color: '#0C2C55' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          style={{
            borderColor: error ? '#EF4444' : '#0C2C55',
            '--tw-ring-color': '#0C2C55'
          } as React.CSSProperties}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
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

Input.displayName = 'Input';
