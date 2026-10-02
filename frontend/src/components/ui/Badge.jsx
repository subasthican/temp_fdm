/**
 * Status pill — variants match the semantic palette. Themes light/dark.
 */
import PropTypes from 'prop-types';

const VARIANTS = {
  primary:
    'bg-primary-50 text-primary-700 ring-primary-600/15 dark:bg-primary-500/15 dark:text-primary-300 dark:ring-primary-400/20',
  success:
    'bg-success-50 text-success-700 ring-success-600/15 dark:bg-success-500/15 dark:text-success-300 dark:ring-success-400/20',
  warning:
    'bg-warning-50 text-warning-700 ring-warning-600/20 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-400/20',
  danger:
    'bg-danger-50 text-danger-700 ring-danger-600/15 dark:bg-danger-500/15 dark:text-danger-300 dark:ring-danger-400/20',
  info: 'bg-info-50 text-info-700 ring-info-600/15 dark:bg-info-500/15 dark:text-info-300 dark:ring-info-400/20',
  gray: 'bg-surface-muted text-muted ring-line-strong/40',
};

const Badge = ({ variant = 'gray', children }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  children: PropTypes.node.isRequired,
};

export default Badge;
