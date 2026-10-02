/**
 * The shared axios instance — the only place HTTP is configured.
 * Attaches the access token, and on a 401 transparently refreshes the
 * session once (rotating tokens) before retrying the original request.
 */
import axios from 'axios';

import { useAuthStore } from '../store/useAuthStore.js';
import { ROUTES } from '../constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise = null;

const refreshSession = async () => {
  const { refreshToken } = useAuthStore.getState();

  // Bare axios (not `api`) so a failing refresh can't loop through
  // this same interceptor.
  const response = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
  );

  const tokens = response.data?.data;
  useAuthStore.getState().setTokens(tokens);

  return tokens.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const { refreshToken } = useAuthStore.getState();

    const isAuthCall = original?.url?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original._retried &&
      !isAuthCall
    ) {
      original._retried = true;

      try {
        // Share one in-flight refresh across parallel 401s.
        refreshPromise = refreshPromise || refreshSession();
        const accessToken = await refreshPromise;
        refreshPromise = null;

        original.headers.Authorization = `Bearer ${accessToken}`;

        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().clearAuth();
        window.location.assign(ROUTES.LOGIN);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
