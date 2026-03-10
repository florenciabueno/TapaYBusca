/**
 * Paleta: naranja #FF8000, naranja suave (secundario), teal #219B9D, gris claro #EEEEEE.
 */
export const PALETTE = {
  cream: '#EEEEEE',
  lightTeal: '#219B9D',
  teal: '#219B9D',
  orange: '#FF8000',
  mutedOrange: '#C97B50',
  violet: '#6B4A8E',
  purple: '#4C1F7A',
  brandDark: '#33555D',
} as const;

export const ACCENT_RGB = '33, 155, 157' as const;
export const PURPLE_RGB = '76, 31, 122' as const;

export const COLORS = {
  ...PALETTE,
  primary: PALETTE.teal,
  accentSecondary: PALETTE.purple,
  primaryHover: '#1A7D7F',
  secondary: PALETTE.mutedOrange,
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
    inProgress: PALETTE.purple,
    inProgressSoft: `rgba(${PURPLE_RGB}, 0.2)`,
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
