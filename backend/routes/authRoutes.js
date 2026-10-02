import express from "express";

import * as authController from "../controllers/authController.js";
import protect from "../middlewares/protect.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  loginValidation,
  refreshTokenValidation,
  updateProfileValidation,
  changePasswordValidation,
} from "../validations/authValidation.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", validateRequest(loginValidation), authController.login);

// POST /api/auth/refresh
router.post(
  "/refresh",
  validateRequest(refreshTokenValidation),
  authController.refreshToken,
);

// POST /api/auth/logout
router.post("/logout", protect, authController.logout);

// GET /api/auth/me
router.get("/me", protect, authController.getMe);

// PATCH /api/auth/me
router.patch(
  "/me",
  protect,
  validateRequest(updateProfileValidation),
  authController.updateProfile,
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  protect,
  validateRequest(changePasswordValidation),
  authController.changePassword,
);

export default router;
