/**
 * Category API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getCategories = async (filters = {}) => {
  const response = await api.post('/categories/list', filters);

  return unwrapApiData(response);
};

export const createCategory = async (payload) => {
  const response = await api.post('/categories', payload);

  return unwrapApiData(response);
};

export const updateCategory = async ({ id, ...payload }) => {
  const response = await api.patch(`/categories/${id}`, payload);

  return unwrapApiData(response);
};

export const softDeleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);

  return unwrapApiData(response);
};
