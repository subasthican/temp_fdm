import express from "express";

import * as inventoryController from "../controllers/inventoryController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  receiveStockValidation,
  adjustStockValidation,
  getStockValidation,
  getBatchesValidation,
  getMovementsValidation,
} from "../validations/inventoryValidation.js";

const router = express.Router();

// POST /api/inventory/receive
router.post(
  "/receive",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(receiveStockValidation),
  inventoryController.receiveStock,
);

// POST /api/inventory/adjust
router.post(
  "/adjust",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(adjustStockValidation),
  inventoryController.adjustStock,
);

// POST /api/inventory/stock/list
router.post(
  "/stock/list",
  protect,
  validateRequest(getStockValidation),
  inventoryController.getStock,
);

// POST /api/inventory/batches/list
router.post(
  "/batches/list",
  protect,
  validateRequest(getBatchesValidation),
  inventoryController.getBatches,
);

// POST /api/inventory/movements/list
router.post(
  "/movements/list",
  protect,
  validateRequest(getMovementsValidation),
  inventoryController.getMovements,
);

export default router;
