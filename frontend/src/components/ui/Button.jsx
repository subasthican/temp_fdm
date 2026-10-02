/**
 * The button for every clickable action. Icon-only usage must pass an
 * aria-label.
 */
import PropTypes from 'prop-types';

import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-ink text-ink-content hover:bg-ink-hover active:bg-ink-hover',
  secondary:
    'bg-surface-muted text-content hover:bg-line active:bg-line-strong',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800',
  success:
    'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
  warning:
    'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700',
  outline:
    'border border-line-strong bg-surface text-content hover:bg-surface-muted active:bg-line',
  ghost: 'bg-transparent text-muted hover:bg-surface-muted hover:text-content',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-xs',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,box-shadow,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  icon: PropTypes.node,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
