/**
 * The content panel used for every back-office section.
 */
import PropTypes from 'prop-types';

const Card = ({
  title,
  subtitle,
  actions,
  padding = true,
  className = '',
  children,
}) => {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-card ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-semibold text-content">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  padding: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Card;
