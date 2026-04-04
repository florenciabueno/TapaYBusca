import { EquationsLayout } from '../components/EquationsLayout';
import { FormPageCard } from '../components/FormPageCard';
import { FormMessage } from '../../../shared/components/ui/FormMessage';
import { Input } from '../../../shared/components/ui/Input/Input';
import { Button } from '../../../shared/components/ui/Button/Button';
import { MathSymbolsPad, DEFAULT_MATH_SYMBOLS } from '../components/MathSymbolsPad';
import { SPACING } from '../../../config/theme';
import { useCreateEquationForm } from '../hooks/useCreateEquationForm';

export const CreateEquationPage = () => {
  const {
    inputRef,
    value,
    error,
    isLoading,
    success,
    inputHandlers,
    handleSymbolClick,
    handleSubmit,
    handleClear,
  } = useCreateEquationForm();

  return (
    <EquationsLayout>
      <div className="w-full flex-1 flex items-center justify-center">
        <FormPageCard
          title="Crear nueva ecuación"
          description="Construye tu ecuación en la forma f(x) = k o k = f(x), con una sola incógnita."
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: SPACING.lg }}>
              <Input
                ref={inputRef}
                label="Tu ecuación:"
                value={value}
                {...inputHandlers}
                placeholder="x*20 = 100"
                error={error}
                helperText="Teclado: números, x, =, operadores (* + - /) y paréntesis"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {success && (
              <FormMessage message={success} variant="success" className="mb-4" />
            )}
            <MathSymbolsPad
              symbols={DEFAULT_MATH_SYMBOLS}
              onSymbolClick={handleSymbolClick}
              disabled={isLoading}
            />
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
      </div>
    </EquationsLayout>
  );
};
