import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EquationsLayout } from '../EquationsLayout';
import { Input } from '../../../../shared/components/ui/Input/Input';
import { Button } from '../../../../shared/components/ui/Button/Button';
import { equationService } from '../../services/equation.service';
import { useAuthStore } from '../../../../stores';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../../../config/theme';
import { ROUTES } from '../../../../config/constants';

const SYMBOLS: { label: string; insert: string }[] = [
  { label: '√', insert: 'sqrt()' },
  { label: '³√', insert: 'raiz3()' },
  { label: '^', insert: '^' },
  { label: '÷', insert: '/' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '+', insert: '+' },
  { label: '-', insert: '-' },
  { label: '×', insert: '*' },
  { label: '=', insert: '=' },
];

export const CreateEquationForm = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleSymbolClick(insert: string) {
    setValue((prev) => prev + insert);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Escribe una ecuación antes de guardar.');
      return;
    }
    setIsLoading(true);
    try {
      await equationService.createEquation(trimmed, token);
      setSuccess('Ecuación guardada correctamente.');
      setValue('');
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la ecuación.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setValue('');
    setError(null);
    setSuccess(null);
  }

  return (
    <EquationsLayout>
      <div className="max-w-3xl mx-auto">
        <div
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.xl,
            boxShadow: SHADOW.lg,
          }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: COLORS.accentSecondary }}
          >
            Crear nueva ecuación
          </h1>
          <p
            className="mb-6 text-sm"
            style={{ color: COLORS.gray[600] }}
          >
            Construye tu ecuación en la forma f(x) = k o k = f(x), con una sola incógnita.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: SPACING.lg }}>
              <Input
                label="Tu ecuación:"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="Ej: x+5=12, sqrt(x+1)=3, raiz2(x)=4"
                error={error}
                helperText="Usa los botones de abajo o escribe directamente. Una sola x permitida."
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {success && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-4"
                style={{
                  backgroundColor: COLORS.success.bg,
                  color: COLORS.success.text,
                }}
                role="status"
              >
                <span>{success}</span>
              </div>
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
        </div>
      </div>
    </EquationsLayout>
  );
};
