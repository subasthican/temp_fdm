import express from "express";

import * as registerController from "../controllers/registerController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createRegisterValidation,
  updateRegisterValidation,
  getRegistersValidation,
  registerIdValidation,
} from "../validations/registerValidation.js";

const router = express.Router();

// POST /api/registers
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createRegisterValidation),
  registerController.createRegister,
);

// POST /api/registers/list — all roles: cashiers list registers to bind a terminal
router.post(
  "/list",
  protect,
  validateRequest(getRegistersValidation),
  registerController.getRegisters,
);

// GET /api/registers/:id
router.get(
  "/:id",
  protect,
  validateRequest(registerIdValidation),
  registerController.getRegisterById,
);

// PATCH /api/registers/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateRegisterValidation),
  registerController.updateRegister,
);

// DELETE /api/registers/:id
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(registerIdValidation),
  registerController.deactivateRegister,
);

export default router;
