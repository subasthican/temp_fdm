/**
 * Segmented-control tabs. A compact, attractive switcher for a small set
 * of views. Horizontally scrollable when the tabs overflow on narrow
 * screens.
 *
 *   <Tabs
 *     tabs={[{ value: 'a', label: 'A', icon: Home }]}
 *     value={active}
 *     onChange={setActive}
 *   />
 */
import PropTypes from 'prop-types';

const Tabs = ({ tabs, value, onChange, className = '' }) => (
  <div className={`scrollbar-thin -mx-1 overflow-x-auto px-1 ${className}`}>
    <div
      role="tablist"
      className="inline-flex gap-1 rounded-xl border border-line bg-surface-muted p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-content/10 ${
              active
                ? 'bg-surface text-content shadow-xs'
                : 'text-muted hover:text-content'
            }`}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default Tabs;
