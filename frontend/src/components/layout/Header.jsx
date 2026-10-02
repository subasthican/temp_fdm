import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';

import { ThemeToggle } from '../ui';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

const Header = ({ user, onMenuClick, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = user?.fullName || user?.username || 'User';

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-line p-2.5 text-muted transition-colors hover:bg-surface-muted hover:text-content lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content">
            Back office
          </p>
          <p className="hidden text-xs text-muted sm:block">
            Manage your retail operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-muted"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-content">
              {getInitials(displayName)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-content">
                {displayName}
              </span>
              <span className="block text-xs capitalize text-muted">
                {user?.role || 'Member'}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`hidden text-faint transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 origin-top-right animate-slide-down overflow-hidden rounded-2xl border border-line bg-elevated p-2 shadow-overlay"
              role="menu"
            >
              <div className="border-b border-line px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-content">
                  <UserRound size={16} className="text-faint" />
                  <span className="truncate">{displayName}</span>
                </div>
                <p className="mt-1 truncate pl-6 text-xs text-muted">
                  {user?.email || `@${user?.username || 'user'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
                role="menuitem"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  user: PropTypes.shape({
    fullName: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }),
  onMenuClick: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Header;
