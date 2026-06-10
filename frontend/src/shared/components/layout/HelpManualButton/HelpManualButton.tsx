import { COLORS } from '../../../../config/theme';

export const HelpManualButton = () => (
  <a
    href="/manual/index.html"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Abrir manual de usuario"
    title="Manual de usuario"
    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border text-3xl font-semibold leading-none shadow-lg transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2"
    style={{
      backgroundColor: COLORS.surface,
      color: COLORS.violet,
      borderColor: COLORS.gray[200],
    }}
  >
    <span aria-hidden="true">?</span>
  </a>
);
