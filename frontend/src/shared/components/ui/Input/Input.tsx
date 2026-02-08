import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export const Input = ({ label, error, className: _, type, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  const inputClasses = 'w-full px-4 py-3 border-2 rounded-lg bg-white focus:outline-none focus:ring-2';

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
      <div className="relative">
        <input
          type={inputType}
          className={inputClasses}
          style={{
            borderColor: error ? '#EF4444' : '#0C2C55',
            '--tw-ring-color': '#0C2C55',
            paddingRight: isPasswordType ? '3rem' : undefined,
          } as React.CSSProperties}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3 3L21 21M10.584 10.587C10.2087 10.9624 9.99778 11.4707 9.99756 12.0013C9.99734 12.5319 10.2078 13.0404 10.5829 13.416C10.958 13.7916 11.4663 14.0025 11.9969 14.0027C12.5275 14.003 13.036 13.7925 13.4116 13.4174M10.584 10.587L13.4116 13.4174M10.584 10.587L8.6364 8.63636M13.4116 13.4174L15.3636 15.3636M8.6364 8.63636C9.57708 8.01833 10.6741 7.69717 11.7927 7.71455C16.1091 7.71455 19.2364 12 19.2364 12C18.6769 12.9091 18.0171 13.7431 17.2727 14.4836M8.6364 8.63636L6.72727 6.72727M15.3636 15.3636C14.4229 15.9817 13.3259 16.3028 12.2073 16.2855C7.89091 16.2855 4.76364 12 4.76364 12C5.32312 11.0909 5.98289 10.2569 6.72727 9.51636L15.3636 15.3636ZM15.3636 15.3636L17.2727 17.2727" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 5C7.68273 5 4.55545 9.28571 4.55545 9.28571C4.55545 9.28571 7.68273 13.5714 12 13.5714C16.3173 13.5714 19.4445 9.28571 19.4445 9.28571C19.4445 9.28571 16.3173 5 12 5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M12 11.5714C13.2607 11.5714 14.2818 10.5503 14.2818 9.28571C14.2818 8.02116 13.2607 7 12 7C10.7393 7 9.71818 8.02116 9.71818 9.28571C9.71818 10.5503 10.7393 11.5714 12 11.5714Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
      </div>
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
};
