/**
 * Inline loading spinner. For a full-area placeholder use LoadingState.
 */
import PropTypes from 'prop-types';

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZES[size]} ${className}`}
    />
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(Object.keys(SIZES)),
  className: PropTypes.string,
};

export default Spinner;
