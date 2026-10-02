import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck, Store, UserRound } from 'lucide-react';

import * as authService from '../../services/authService.js';
import { useApiMutation } from '../../hooks/api';
import { useAuthStore } from '../../store/useAuthStore.js';
import { ROLES, ROUTES } from '../../constants';
import { Button, Input, ThemeToggle } from '../../components/ui';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel.jsx';
import PasswordInput from '../../components/auth/PasswordInput.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useApiMutation(authService.login, {
    onSuccess: (data) => {
      setAuth(data);
      navigate(data.user.role === ROLES.CASHIER ? ROUTES.POS : ROUTES.DASHBOARD);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <main className="grid min-h-screen bg-app lg:h-screen lg:grid-cols-[1.1fr_1fr] lg:overflow-hidden">
      <AuthBrandPanel />

      <section className="relative flex min-h-screen items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:min-h-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(99_102_241/0.08),transparent_48%)]" />

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-7 flex items-center justify-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-600/30">
              <Store size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight text-content">
                Project D POS
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Intelligent retail
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-raised sm:p-9">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                <ShieldCheck size={13} aria-hidden="true" /> Secure sign in
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-content">
                Welcome back
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Sign in to access your sales, inventory, and reports.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                leftIcon={<UserRound size={18} aria-hidden="true" />}
                placeholder="Enter your username"
                className="h-12 text-base"
                autoFocus
                autoComplete="username"
                disabled={loginMutation.isPending}
                required
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loginMutation.isPending}
                required
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loginMutation.isPending}
                disabled={!username || !password}
                className="mt-1"
              >
                <span>{loginMutation.isPending ? 'Signing in...' : 'Sign in'}</span>
                {!loginMutation.isPending && <ArrowRight size={18} aria-hidden="true" />}
              </Button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-line pt-5 text-center text-xs text-faint">
              <LockKeyhole size={13} aria-hidden="true" />
              Role-based access · Secure session
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
