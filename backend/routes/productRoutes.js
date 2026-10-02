import express from "express";

import * as productController from "../controllers/productController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createProductValidation,
  updateProductValidation,
  getProductsValidation,
  productIdValidation,
  setProductPriceValidation,
  generateBarcodeValidation,
} from "../validations/productValidation.js";

const router = express.Router();

// POST /api/products
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(createProductValidation),
  productController.createProduct,
);

// POST /api/products/list
router.post(
  "/list",
  protect,
  validateRequest(getProductsValidation),
  productController.getProducts,
);

// POST /api/products/:id/prices
router.post(
  "/:id/prices",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(setProductPriceValidation),
  productController.setProductPrice,
);

// POST /api/products/:id/barcode
router.post(
  "/:id/barcode",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(generateBarcodeValidation),
  productController.generateBarcode,
);

// GET /api/products/:id
router.get(
  "/:id",
  protect,
  validateRequest(productIdValidation),
  productController.getProductById,
);

// PATCH /api/products/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(updateProductValidation),
  productController.updateProduct,
);

// DELETE /api/products/:id — soft delete, admin only
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(productIdValidation),
  productController.softDeleteProduct,
);

export default router;
