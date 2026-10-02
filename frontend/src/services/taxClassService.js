/**
 * Tax class API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getTaxClasses = async (filters = {}) => {
  const response = await api.post('/tax-classes/list', filters);

  return unwrapApiData(response);
};

export const createTaxClass = async (payload) => {
  const response = await api.post('/tax-classes', payload);

  return unwrapApiData(response);
};

export const updateTaxClass = async ({ id, ...payload }) => {
  const response = await api.patch(`/tax-classes/${id}`, payload);

  return unwrapApiData(response);
};

export const softDeleteTaxClass = async (id) => {
  const response = await api.delete(`/tax-classes/${id}`);

  return unwrapApiData(response);
};
