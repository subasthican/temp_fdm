import express from "express";

import * as taxClassController from "../controllers/taxClassController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createTaxClassValidation,
  updateTaxClassValidation,
  getTaxClassesValidation,
  taxClassIdValidation,
} from "../validations/taxClassValidation.js";

const router = express.Router();

// POST /api/tax-classes
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(createTaxClassValidation),
  taxClassController.createTaxClass,
);

// POST /api/tax-classes/list
router.post(
  "/list",
  protect,
  validateRequest(getTaxClassesValidation),
  taxClassController.getTaxClasses,
);

// PATCH /api/tax-classes/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(updateTaxClassValidation),
  taxClassController.updateTaxClass,
);

// DELETE /api/tax-classes/:id — soft delete, admin only
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(taxClassIdValidation),
  taxClassController.softDeleteTaxClass,
);

export default router;
