/**
 * Register API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getRegisters = async (filters = {}) => {
  const response = await api.post('/registers/list', filters);

  return unwrapApiData(response);
};

export const getRegisterById = async (id) => {
  const response = await api.get(`/registers/${id}`);

  return unwrapApiData(response);
};

export const createRegister = async (payload) => {
  const response = await api.post('/registers', payload);

  return unwrapApiData(response);
};

export const updateRegister = async ({ id, ...payload }) => {
  const response = await api.patch(`/registers/${id}`, payload);

  return unwrapApiData(response);
};

export const deactivateRegister = async (id) => {
  const response = await api.delete(`/registers/${id}`);

  return unwrapApiData(response);
};
