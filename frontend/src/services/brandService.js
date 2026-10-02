/**
 * Brand API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getBrands = async (filters = {}) => {
  const response = await api.post('/brands/list', filters);

  return unwrapApiData(response);
};

export const createBrand = async (payload) => {
  const response = await api.post('/brands', payload);

  return unwrapApiData(response);
};

export const updateBrand = async ({ id, ...payload }) => {
  const response = await api.patch(`/brands/${id}`, payload);

  return unwrapApiData(response);
};

export const softDeleteBrand = async (id) => {
  const response = await api.delete(`/brands/${id}`);

  return unwrapApiData(response);
};
