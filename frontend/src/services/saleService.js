/**
 * Sale / checkout API service — every method unwraps the response
 * envelope and returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

// Resolve a scanned/searched item into a sellable line (price + FEFO
// batch) for the terminal's store.
export const lookupItem = async ({ storeId, barcode, productId }) => {
  const response = await api.post('/sales/lookup', {
    storeId,
    barcode,
    productId,
  });

  return unwrapApiData(response)?.item;
};

// Complete a sale. clientSaleId makes it idempotent — a retry returns
// the original sale instead of double-posting.
export const completeSale = async (payload) => {
  const response = await api.post('/sales', payload);

  return unwrapApiData(response)?.sale;
};

export const getSaleById = async (id) => {
  const response = await api.get(`/sales/${id}`);

  return unwrapApiData(response)?.sale;
};
