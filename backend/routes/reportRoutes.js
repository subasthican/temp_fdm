import express from "express";

import * as reportController from "../controllers/reportController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import { getDashboardValidation } from "../validations/reportValidation.js";

const router = express.Router();

// POST /api/reports/dashboard — back office only
router.post(
  "/dashboard",
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER),
  validateRequest(getDashboardValidation),
  reportController.getDashboard,
);

export default router;
