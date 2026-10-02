/**
 * Empty lists and load failures — the standard "empty" and "error"
 * branches of every data-fetching page.
 */
import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title, message, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-faint">
        {icon || <Inbox size={26} aria-hidden="true" />}
      </span>

      <h3 className="text-sm font-semibold text-content">{title}</h3>

      {message && (
        <p className="max-w-sm text-sm leading-relaxed text-muted">{message}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
};

export default EmptyState;
