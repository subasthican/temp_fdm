import express from "express";

import * as brandController from "../controllers/brandController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createBrandValidation,
  updateBrandValidation,
  getBrandsValidation,
  brandIdValidation,
} from "../validations/brandValidation.js";

const router = express.Router();

// POST /api/brands
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(createBrandValidation),
  brandController.createBrand,
);

// POST /api/brands/list
router.post(
  "/list",
  protect,
  validateRequest(getBrandsValidation),
  brandController.getBrands,
);

// PATCH /api/brands/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(updateBrandValidation),
  brandController.updateBrand,
);

// DELETE /api/brands/:id — soft delete, admin only
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(brandIdValidation),
  brandController.softDeleteBrand,
);

export default router;
