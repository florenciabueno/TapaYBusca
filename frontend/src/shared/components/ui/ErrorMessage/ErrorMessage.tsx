interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className = '' }: ErrorMessageProps) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md ${className}`}
      role="alert"
    >
      <div className="shrink-0">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-red-600"
        >
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
          <path 
            d="M10 6V11" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
        </svg>
      </div>
      <p className="text-sm flex-1">{message}</p>
    </div>
  );
};
