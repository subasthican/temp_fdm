import { PALETTE } from './src/constants/colors.js';

/**
 * Semantic chrome tokens (surfaces, text, borders) resolve to CSS variables
 * defined in index.css, so `bg-surface`, `text-content`, `border-line`, ...
 * automatically flip between the light and dark themes. Brand/status scales
 * (primary/success/warning/danger/info) come straight from PALETTE.
 */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: PALETTE.primary,
        success: PALETTE.success,
        warning: PALETTE.warning,
        danger: PALETTE.danger,
        info: PALETTE.info,

        // Theme-aware chrome
        app: withVar('--c-app'),
        surface: withVar('--c-surface'),
        'surface-muted': withVar('--c-surface-muted'),
        elevated: withVar('--c-elevated'),
        line: withVar('--c-line'),
        'line-strong': withVar('--c-line-strong'),
        content: withVar('--c-content'),
        muted: withVar('--c-muted'),
        faint: withVar('--c-faint'),

        // Inverting action color (black on light, white on dark)
        ink: withVar('--c-ink'),
        'ink-content': withVar('--c-ink-content'),
        'ink-hover': withVar('--c-ink-hover'),
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.05)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        raised:
          '0 4px 12px -2px rgb(15 23 42 / 0.10), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        overlay:
          '0 24px 48px -12px rgb(15 23 42 / 0.28), 0 8px 20px -8px rgb(15 23 42 / 0.16)',
        focus: '0 0 0 3px rgb(99 102 241 / 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.14s ease-out',
      },
    },
  },
  plugins: [],
};
