/**
 * User (staff) API service — every method unwraps the response envelope
 * and returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getUsers = async (filters = {}) => {
  const response = await api.post('/users/list', filters);

  return unwrapApiData(response);
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);

  return unwrapApiData(response)?.user;
};

export const createUser = async (payload) => {
  const response = await api.post('/users', payload);

  return unwrapApiData(response);
};

export const updateUser = async ({ id, ...payload }) => {
  const response = await api.patch(`/users/${id}`, payload);

  return unwrapApiData(response);
};

export const resetPassword = async ({ id, newPassword }) => {
  const response = await api.post(`/users/${id}/reset-password`, { newPassword });

  return unwrapApiData(response);
};

export const softDeleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);

  return unwrapApiData(response);
};
