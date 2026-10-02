import * as productService from "../services/productService.js";

// POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/list
export const getProducts = async (req, res, next) => {
  try {
    const data = await productService.getProducts(req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await productService.getProductById(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await productService.updateProduct(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const softDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await productService.softDeleteProduct(id);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/prices
export const setProductPrice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await productService.setProductPrice(id, req.body);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/barcode
export const generateBarcode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    const data = await productService.generateBarcode(id, format);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export default {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  softDeleteProduct,
  setProductPrice,
  generateBarcode,
};
