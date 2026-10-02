/**
 * Store API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getStores = async (filters = {}) => {
  const response = await api.post('/stores/list', filters);

  return unwrapApiData(response);
};

export const getStoreById = async (id) => {
  const response = await api.get(`/stores/${id}`);

  return unwrapApiData(response);
};

export const createStore = async (payload) => {
  const response = await api.post('/stores', payload);

  return unwrapApiData(response);
};

export const updateStore = async ({ id, ...payload }) => {
  const response = await api.patch(`/stores/${id}`, payload);

  return unwrapApiData(response);
};

export const deactivateStore = async (id) => {
  const response = await api.delete(`/stores/${id}`);

  return unwrapApiData(response);
};
