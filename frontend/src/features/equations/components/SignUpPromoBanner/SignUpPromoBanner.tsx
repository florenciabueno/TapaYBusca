import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../config/constants';
import { usePromoBanner } from '../../../../shared/context/PromoBannerContext';
import { COLORS, PURPLE_RGB, RADIUS } from '../../../../config/theme';

const BENEFITS = [
  'Crear y resolver tus propias ecuaciones',
  'Descargar ecuaciones compartidas por otros usuarios',
  'Llevar el registro de tu progreso',
] as const;

const SparklesIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.545 4.635L18 9.27l-4.455 1.635L12 15.54l-1.545-4.635L6 9.27l4.455-1.635L12 3z" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M5 19l.5-1.5 1 .5-.5 1-1-.5z" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M19 5l-.5 1.5-1-.5.5-1 1 .5z" />
    </svg>
  );
};

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
    </svg>
  );
};

const CloseIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
};

export const SignUpPromoBanner = () => {
  const promo = usePromoBanner();
  if (promo?.isPromoDismissed) return null;

  return (
    <div
      className="relative mb-6 rounded-xl border p-5 transition-all duration-200 hover:shadow-lg"
      style={{
        borderWidth: '1px 1px 1px 4px',
        borderTopWidth: '2px',
        borderColor: COLORS.gray[200],
        borderLeftColor: COLORS.accentSecondary,
        borderTopColor: COLORS.accentSecondary,
        background: `linear-gradient(135deg, rgba(${PURPLE_RGB}, 0.14) 0%, rgba(${PURPLE_RGB}, 0.06) 50%, rgba(${PURPLE_RGB}, 0.03) 100%)`,
        boxShadow: `0 4px 20px rgba(${PURPLE_RGB}, 0.12), 0 1px 3px rgba(0,0,0,0.06)`,
        borderRadius: RADIUS.xl,
      }}
    >
      <button
        type="button"
        onClick={() => promo?.dismissPromo()}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400/40"
        style={{ color: COLORS.gray[500] }}
        aria-label="Cerrar"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="mb-3 flex items-center gap-3 text-xl font-bold"
            style={{ color: COLORS.accentSecondary }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `rgba(${PURPLE_RGB}, 0.2)`,
                color: COLORS.accentSecondary,
                border: `1px solid rgba(${PURPLE_RGB}, 0.3)`,
              }}
            >
              <SparklesIcon className="h-6 w-6" />
            </span>
            ¡Crea tu cuenta para acceder a más funcionalidades!
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: COLORS.gray[700] }}>
            {BENEFITS.map((text) => (
              <li key={text} className="flex items-center gap-2.5">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `rgba(${PURPLE_RGB}, 0.15)`, color: COLORS.accentSecondary }}
                  aria-hidden
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-5 sm:items-end">
          <Link
            to={ROUTES.REGISTER}
            className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2"
            style={{
              backgroundColor: COLORS.orange,
              color: COLORS.surface,
              boxShadow: '0 2px 10px rgba(255, 128, 0, 0.4)',
            }}
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
};
