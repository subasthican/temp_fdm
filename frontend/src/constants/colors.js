/**
 * Single source of truth for the color palette.
 * tailwind.config.js reads PALETTE, so semantic brand/status classes exist
 * for every token (primary-*, success-*, ...). App chrome (surfaces, text,
 * borders) is driven by CSS variables — see index.css — and exposed through
 * Tailwind as bg-app / bg-surface / text-content / border-line / ... so the
 * whole UI themes light and dark from one place.
 *
 * No hex codes in components — for JS color needs (charts, canvas) import
 * PALETTE / CHART_COLORS / STATUS_COLORS from here.
 */

export const PALETTE = {
  // Accent — Uber-style blue. Used for links, focus rings, and subtle
  // highlights. Primary actions use the inverting `ink` color, not this.
  primary: {
    50: '#eef3ff',
    100: '#d9e6ff',
    200: '#b3ccff',
    300: '#85abff',
    400: '#5088f5',
    500: '#276ef1',
    600: '#1a5fd6',
    700: '#1450b0',
    800: '#163f85',
    900: '#17356b',
    950: '#0f234a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
};

export const CHART_COLORS = [
  PALETTE.primary[500],
  PALETTE.success[500],
  PALETTE.warning[500],
  PALETTE.info[500],
  PALETTE.danger[500],
  PALETTE.primary[300],
  PALETTE.success[300],
  PALETTE.warning[300],
];

export const STATUS_COLORS = {
  success: PALETTE.success[500],
  warning: PALETTE.warning[500],
  danger: PALETTE.danger[500],
  info: PALETTE.info[500],
};
