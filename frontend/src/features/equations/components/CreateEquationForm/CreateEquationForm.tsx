import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EquationsLayout } from '../EquationsLayout';
import { FormPageCard } from '../FormPageCard';
import { FormMessage } from '../../../../shared/components/ui/FormMessage';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { equationService } from '../../services/equation.service';
import { useAuthStore } from '../../../../stores';
import { queryKeys } from '../../../../shared/query-keys';
import { COLORS, SPACING } from '../../../../config/theme';
import { ROUTES } from '../../../../config/constants';

const SYMBOLS: { label: string; insert: string }[] = [
  { label: '√', insert: 'sqrt()' },
  { label: '³√', insert: 'cbrt()' },
  { label: '^', insert: '^' },
  { label: '÷', insert: '/' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '×', insert: '*' },
  { label: '=', insert: '=' },
];

const ALLOWED_KEYS = new Set([
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'x', 'X', '=',
  'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
]);

export const CreateEquationForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [value, setValue] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (equation: string) => equationService.createEquation(equation, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.equations.all });
      setSuccess('Ecuación guardada correctamente.');
      setValue('');
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1500);
    },
  });

  const error =
    validationError ||
    (createMutation.error
      ? createMutation.error instanceof Error
        ? createMutation.error.message
        : 'Error al crear la ecuación.'
      : null);
  const isLoading = createMutation.isPending;

  function handleSymbolClick(insert: string) {
    setValue((prev) => prev + insert);
    setValidationError(null);
    createMutation.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.reset();
    setSuccess(null);
    setValidationError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationError('Escribe una ecuación antes de guardar.');
      return;
    }
    createMutation.mutate(trimmed);
  }

  function handleClear() {
    setValue('');
    setValidationError(null);
    setSuccess(null);
    createMutation.reset();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (ALLOWED_KEYS.has(e.key)) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x') return;
    }
    e.preventDefault();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const sanitized = pasted.replace(/[^0-9x=]/gi, '');
    if (!sanitized) return;
    const input = e.target as HTMLInputElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    setValue((prev) => prev.slice(0, start) + sanitized + prev.slice(end));
  }

  return (
    <EquationsLayout>
      <FormPageCard
        title="Crear nueva ecuación"
        description="Construye tu ecuación en la forma f(x) = k o k = f(x), con una sola incógnita."
      >
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: SPACING.lg }}>
              <Input
                label="Tu ecuación:"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setValidationError(null);
                  createMutation.reset();
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Solo números y x; usa la botonera para el resto"
                error={error}
                helperText="Escribe números y x con el teclado. Usa los botones para operadores y funciones (√, +, =, etc.)."
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {success && (
              <FormMessage message={success} variant="success" className="mb-4" />
            )}

            <div style={{ marginBottom: SPACING.lg }}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.accentSecondary }}
              >
                Símbolos matemáticos:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SYMBOLS.map(({ label, insert }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSymbolClick(insert)}
                    disabled={isLoading}
                    className="py-3 rounded-xl font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                    style={{
                      backgroundColor: COLORS.gray[100],
                      color: COLORS.gray[800],
                      border: `1px solid ${COLORS.gray[200]}`,
                      ['--tw-ring-color' as string]: COLORS.accentSecondary,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="accent"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Guardar ecuación
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Limpiar
              </Button>
            </div>
          </form>
      </FormPageCard>
    </EquationsLayout>
  );
};
