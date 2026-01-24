interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className = '' }: ErrorMessageProps) => {
  return (
    <div
      className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`}
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
    </div>
  );
};
