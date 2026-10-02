import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, Store, X } from 'lucide-react';

const Sidebar = ({ items, collapsed, mobileOpen, onCollapse, onClose }) => (
  <>
    {mobileOpen && (
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden"
        onClick={onClose}
        aria-label="Close navigation"
      />
    )}

    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'} ${mobileOpen ? 'translate-x-0 shadow-overlay' : '-translate-x-full lg:shadow-none'}`}
    >
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
            <Store size={18} aria-hidden="true" />
          </span>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate text-sm font-semibold tracking-tight text-content">
              Project D POS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
              Back office
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-content lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={19} />
        </button>
      </div>

      <nav
        className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group flex h-10 items-center rounded-lg text-sm transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : 'px-3'} ${
                isActive
                  ? 'bg-surface-muted font-semibold text-content'
                  : 'font-medium text-muted hover:bg-surface-muted/60 hover:text-content'
              }`
            }
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className={`ml-3 truncate ${collapsed ? 'lg:hidden' : ''}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden border-t border-line p-3 lg:block">
        <button
          type="button"
          onClick={onCollapse}
          className={`flex h-10 w-full items-center rounded-lg text-sm text-muted transition-colors hover:bg-surface-muted hover:text-content ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  </>
);

Sidebar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    }),
  ).isRequired,
  collapsed: PropTypes.bool.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
