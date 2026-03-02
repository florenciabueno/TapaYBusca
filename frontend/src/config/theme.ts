/**
 * Paleta coherente en tono #0A809D (rgb 10, 128, 157).
 * - Header y sidebar: mismo tono en rgba.
 * - Bordes, botones, activos: misma familia.
 */
export const PALETTE = {
  cream: '#E3F1F5',
  lightTeal: '#0A809D',
  teal: '#086B85',
  orange: '#EB8B4A',
} as const;

/** Base RGB para header/sidebar y fondos suaves (10, 128, 157) */
export const ACCENT_RGB = '10, 128, 157' as const;

export const COLORS = {
  ...PALETTE,
  primary: PALETTE.teal,
  primaryHover: '#065A70',
  secondary: '#5a7a80',
  background: PALETTE.cream,
  surface: '#ffffff',
  success: {
    bg: '#dcfce7',
    text: '#166534',
    main: '#22C55E',
  },
  error: {
    bg: '#fee2e2',
    text: '#991b1b',
    main: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    bg: '#fffbeb',
    text: '#92400e',
    main: PALETTE.orange,
  },
  status: {
    pending: '#5a7a80',
    pendingSoft: `rgba(${ACCENT_RGB}, 0.35)`,
    inProgress: '#c4a03e',
    inProgressSoft: '#fef3c7',
    completed: '#22C55E',
    completedSoft: '#dcfce7',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;

export const RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const;

export const SHADOW = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;
