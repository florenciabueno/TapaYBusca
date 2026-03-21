import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EquationsLayout } from '../EquationsLayout';
import { FormPageCard } from '../FormPageCard';
import { FormMessage } from '../../../../shared/components/ui/FormMessage';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { MathSymbolsPad, DEFAULT_MATH_SYMBOLS } from '../MathSymbolsPad';
import { equationService } from '../../services/equation.service';
import { useAuthStore } from '../../../../stores';
import { queryKeys } from '../../../../shared/query-keys';
import { SPACING } from '../../../../config/theme';
import { ROUTES } from '../../../../config/constants';
import {
  handleEquationInputKeyDown,
  handleEquationInputPaste,
} from '../../utils/equation-input-guards';

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
                onKeyDown={handleEquationInputKeyDown}
                onPaste={(e) => handleEquationInputPaste(e, setValue)}
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
              <MathSymbolsPad
                symbols={DEFAULT_MATH_SYMBOLS}
                onSymbolClick={handleSymbolClick}
                disabled={isLoading}
              />
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
