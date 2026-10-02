/**
 * Auth API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const login = async ({ username, password }) => {
  const response = await api.post('/auth/login', { username, password });

  return unwrapApiData(response);
};

export const logout = async () => {
  const response = await api.post('/auth/logout');

  return unwrapApiData(response);
};

export const getMe = async () => {
  const response = await api.get('/auth/me');

  return unwrapApiData(response);
};

export const updateProfile = async (payload) => {
  const response = await api.patch('/auth/me', payload);

  return unwrapApiData(response);
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });

  return unwrapApiData(response);
};
