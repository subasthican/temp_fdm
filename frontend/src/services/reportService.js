/**
 * Reports API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getDashboard = async (filters = {}) => {
  const response = await api.post('/reports/dashboard', filters);

  return unwrapApiData(response);
};
