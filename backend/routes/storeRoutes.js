import express from "express";

import * as storeController from "../controllers/storeController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createStoreValidation,
  updateStoreValidation,
  getStoresValidation,
  storeIdValidation,
} from "../validations/storeValidation.js";

const router = express.Router();

// POST /api/stores
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createStoreValidation),
  storeController.createStore,
);

// POST /api/stores/list — all roles: cashiers list stores to bind a terminal
router.post(
  "/list",
  protect,
  validateRequest(getStoresValidation),
  storeController.getStores,
);

// GET /api/stores/:id
router.get(
  "/:id",
  protect,
  validateRequest(storeIdValidation),
  storeController.getStoreById,
);

// PATCH /api/stores/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateStoreValidation),
  storeController.updateStore,
);

// DELETE /api/stores/:id
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(storeIdValidation),
  storeController.deactivateStore,
);

export default router;
