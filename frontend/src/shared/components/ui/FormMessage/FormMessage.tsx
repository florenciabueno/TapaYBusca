import { COLORS } from '../../../../config/theme';

export type FormMessageVariant = 'success' | 'error';

export interface FormMessageProps {
  message: string;
  variant: FormMessageVariant;
  className?: string;
}

export const FormMessage = ({ message, variant, className = '' }: FormMessageProps) => {
  const isSuccess = variant === 'success';
  const style = isSuccess
    ? { backgroundColor: COLORS.success.bg, color: COLORS.success.text }
    : { backgroundColor: COLORS.error.bg, color: COLORS.error.text };

  return (
    <div
      className={`rounded-lg p-3 text-sm ${className}`.trim()}
      style={style}
      role={isSuccess ? 'status' : 'alert'}
    >
      {message}
    </div>
  );
};
