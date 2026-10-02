import express from "express";

import * as userController from "../controllers/userController.js";
import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import validateRequest from "../middlewares/validateRequest.js";
import { USER_ROLES } from "../config/constants.js";
import {
  createUserValidation,
  updateUserValidation,
  getUsersValidation,
  resetPasswordValidation,
  userIdValidation,
} from "../validations/userValidation.js";

const router = express.Router();

// POST /api/users — admin only
router.post(
  "/",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createUserValidation),
  userController.createUser,
);

// POST /api/users/list
router.post(
  "/list",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(getUsersValidation),
  userController.getUsers,
);

// POST /api/users/:id/reset-password
router.post(
  "/:id/reset-password",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(resetPasswordValidation),
  userController.resetPassword,
);

// GET /api/users/:id
router.get(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(userIdValidation),
  userController.getUserById,
);

// PATCH /api/users/:id
router.patch(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateUserValidation),
  userController.updateUser,
);

// DELETE /api/users/:id — soft delete
router.delete(
  "/:id",
  protect,
  authorize(USER_ROLES.ADMIN),
  validateRequest(userIdValidation),
  userController.softDeleteUser,
);

export default router;
