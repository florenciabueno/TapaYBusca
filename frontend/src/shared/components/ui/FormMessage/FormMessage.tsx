import { COLORS } from '../../../../config/theme';

export type FormMessageVariant = 'success' | 'error' | 'info';

export interface FormMessageProps {
  message: string;
  variant: FormMessageVariant;
  className?: string;
}

export const FormMessage = ({ message, variant, className = '' }: FormMessageProps) => {
  const style =
    variant === 'success'
      ? { backgroundColor: COLORS.success.bg, color: COLORS.success.text }
      : variant === 'error'
        ? { backgroundColor: COLORS.error.bg, color: COLORS.error.text }
        : { backgroundColor: COLORS.gray[50], color: COLORS.accentSecondary };

  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div
      className={`rounded-lg p-3 text-sm ${className}`.trim()}
      style={style}
      role={role}
    >
      {message}
    </div>
  );
};
