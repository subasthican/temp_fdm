import express from "express";

import * as saleController from "../controllers/saleController.js";
import protect from "../middlewares/protect.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  lookupItemValidation,
  completeSaleValidation,
  saleIdValidation,
} from "../validations/saleValidation.js";

const router = express.Router();

// POST /api/sales/lookup — any authenticated role (cashiers sell)
router.post(
  "/lookup",
  protect,
  validateRequest(lookupItemValidation),
  saleController.lookupItem,
);

// POST /api/sales — complete a sale (any authenticated role)
router.post(
  "/",
  protect,
  validateRequest(completeSaleValidation),
  saleController.completeSale,
);

// GET /api/sales/:id
router.get(
  "/:id",
  protect,
  validateRequest(saleIdValidation),
  saleController.getSaleById,
);

export default router;
