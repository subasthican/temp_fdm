/**
 * Full-area loading placeholder — the standard "isLoading" branch of
 * every data-fetching page.
 */
import PropTypes from 'prop-types';

import Spinner from './Spinner.jsx';

const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted">
      <Spinner size="lg" className="text-primary-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

LoadingState.propTypes = {
  message: PropTypes.string,
};

export default LoadingState;
