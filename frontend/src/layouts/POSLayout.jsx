/**
 * POS terminal layout — full-screen, minimal chrome, built for speed.
 * The top bar shows the cashier and an exit back to the back office
 * (back-office roles only).
 */
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';

import * as authService from '../services/authService.js';
import { ThemeToggle } from '../components/ui';
import { useAuthStore } from '../store/useAuthStore.js';
import { useRegisterStore } from '../store/useRegisterStore.js';
import { BACK_OFFICE_ROLES, ROUTES } from '../constants';

const POSLayout = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { store, register, clearBinding } = useRegisterStore();

  const canExitToBackOffice = BACK_OFFICE_ROLES.includes(user?.role);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-app">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-3">
          {canExitToBackOffice && (
            <Link
              to={ROUTES.DASHBOARD}
              aria-label="Back to back office"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-content"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <span className="text-sm font-semibold text-content">
            POS Terminal
          </span>

          {store && register && (
            <button
              type="button"
              onClick={() => {
                clearBinding();
                navigate(ROUTES.SELECT_REGISTER);
              }}
              title="Switch register"
              className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-line hover:text-content"
            >
              {store.name} · {register.code}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:block">
            {user?.fullName}
          </span>

          <ThemeToggle className="h-9 w-9" />

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-content"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default POSLayout;
