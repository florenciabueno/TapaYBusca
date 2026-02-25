export const COLORS = {
  primary: '#0C2C55',
  secondary: '#296374',
  accent: '#629FAD',
  light: '#EDEDCE',
  success: {
    bg: '#d4edda',
    text: '#155724',
    main: '#22C55E',
  },
  error: {
    bg: '#fee',
    text: '#c00',
    main: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    main: '#FF8C42',
  },
  status: {
    pending: '#629FAD',
    inProgress: '#FF8C42',
    completed: '#4CAF50',
  },
  gray: {
    100: '#f7f7f7',
    200: '#e5e5e5',
    300: '#d4d4d4',
  },
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;
