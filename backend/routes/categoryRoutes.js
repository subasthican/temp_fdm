import express from "express";

import * as categoryController from "../controllers/categoryController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createCategoryValidation,
  updateCategoryValidation,
  getCategoriesValidation,
  categoryIdValidation,
} from "../validations/categoryValidation.js";

const router = express.Router();

// POST /api/categories
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(createCategoryValidation),
  categoryController.createCategory,
);

// POST /api/categories/list
router.post(
  "/list",
  protect,
  validateRequest(getCategoriesValidation),
  categoryController.getCategories,
);

// PATCH /api/categories/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(updateCategoryValidation),
  categoryController.updateCategory,
);

// DELETE /api/categories/:id — soft delete, admin only
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(categoryIdValidation),
  categoryController.softDeleteCategory,
);

export default router;
