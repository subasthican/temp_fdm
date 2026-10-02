/**
 * Product API service — every method unwraps the response envelope and
 * returns plain data.
 */
import api from './api.js';
import { unwrapApiData } from '../utils/unwrapApiData.js';

export const getProducts = async (filters = {}) => {
  const response = await api.post('/products/list', filters);

  return unwrapApiData(response);
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);

  // The envelope nests the product under `.product`; return it directly
  // so callers read `.barcodes` / `.prices` / `.pricingMode` off the top.
  return unwrapApiData(response)?.product;
};

export const createProduct = async (payload) => {
  const response = await api.post('/products', payload);

  return unwrapApiData(response);
};

export const updateProduct = async ({ id, ...payload }) => {
  const response = await api.patch(`/products/${id}`, payload);

  return unwrapApiData(response);
};

export const softDeleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);

  return unwrapApiData(response);
};

// Upsert one store's price for a product.
export const setProductPrice = async ({ id, ...payload }) => {
  const response = await api.post(`/products/${id}/prices`, payload);

  return unwrapApiData(response);
};

// Mint/assign a barcode (format: 'ean13' | 'code128').
export const generateBarcode = async ({ id, format }) => {
  const response = await api.post(`/products/${id}/barcode`, { format });

  return unwrapApiData(response);
};
