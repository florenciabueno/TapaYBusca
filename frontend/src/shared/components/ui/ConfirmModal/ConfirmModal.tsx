import { useEffect, useRef } from 'react';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../../../config/theme';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const confirmBg = isDanger ? COLORS.error.main : COLORS.primary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-xl transition-all"
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOW.lg,
          border: `1px solid ${COLORS.gray[200]}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="text-lg font-semibold"
          style={{ color: COLORS.brandDark, marginBottom: SPACING.sm }}
        >
          {title}
        </h2>
        <p
          id="confirm-modal-desc"
          className="text-sm"
          style={{ color: COLORS.gray[600], marginBottom: SPACING.lg }}
        >
          {message}
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              borderColor: COLORS.primary,
              color: COLORS.primary,
              backgroundColor: 'transparent',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: confirmBg,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
