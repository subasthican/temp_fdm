/**
 * Inventory API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const receiveStock = async (payload) => {
  const response = await api.post('/inventory/receive', payload);

  return unwrapApiData(response);
};

export const adjustStock = async (payload) => {
  const response = await api.post('/inventory/adjust', payload);

  return unwrapApiData(response);
};

export const getStock = async (filters = {}) => {
  const response = await api.post('/inventory/stock/list', filters);

  return unwrapApiData(response);
};

export const getBatches = async (filters = {}) => {
  const response = await api.post('/inventory/batches/list', filters);

  return unwrapApiData(response);
};

export const getMovements = async (filters = {}) => {
  const response = await api.post('/inventory/movements/list', filters);

  return unwrapApiData(response);
};
