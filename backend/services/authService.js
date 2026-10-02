import jwt from "jsonwebtoken";

import config from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import handleServiceError from "../utils/handleServiceError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { generateTokens } from "../helpers/auth/generateTokens.js";
import { hashPassword } from "../helpers/auth/hashPassword.js";
import { comparePassword } from "../helpers/auth/comparePassword.js";

// ============================================
// Auth Operations
// ============================================

export const login = async (username, password) => {
  try {
    // Deleted users are treated as unknown (generic credential error).
    const user = await User.findOne({
      username,
      isDeleted: { $ne: true },
    }).select("+password");

    // Same generic message for unknown user and wrong password —
    // never reveal which one failed.
    if (!user || !(await comparePassword(password, user.password))) {
      throw ApiError.unauthorized(
        "Invalid username or password",
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        "This account has been deactivated",
        ERROR_CODES.USER_INACTIVE,
      );
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in login");
  }
};

export const logout = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });

    return {
      success: true,
      message: "Logged out successfully",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in logout");
  }
};

export const refreshToken = async (token) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch (err) {
      throw ApiError.unauthorized(
        "Invalid or expired refresh token",
        ERROR_CODES.AUTH_REFRESH_INVALID,
      );
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    // The presented token must match the one persisted on the user —
    // a rotated-out (or cleared-on-logout) token is rejected even if
    // its signature is still valid.
    if (!user || user.isDeleted || user.refreshToken !== token) {
      throw ApiError.unauthorized(
        "Invalid or expired refresh token",
        ERROR_CODES.AUTH_REFRESH_INVALID,
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        "This account has been deactivated",
        ERROR_CODES.USER_INACTIVE,
      );
    }

    // Rotate on every refresh.
    const tokens = generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in refreshToken");
  }
};

// ============================================
// Profile Operations
// ============================================

export const getMe = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    return {
      success: true,
      message: "Profile fetched",
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in getMe");
  }
};

export const updateProfile = async (userId, data) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    // Whitelist update fields — never spread a request body.
    const updates = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;

    Object.assign(user, updates);
    await user.save();

    return {
      success: true,
      message: "Profile updated",
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      },
    };
  } catch (error) {
    throw handleServiceError(error, "Error in updateProfile");
  }
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw ApiError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
    }

    const matches = await comparePassword(currentPassword, user.password);

    if (!matches) {
      throw ApiError.unauthorized(
        "Current password is incorrect",
        ERROR_CODES.AUTH_PASSWORD_INCORRECT,
      );
    }

    // Models are schema-only, so the service hashes explicitly (§7).
    // Changing the password invalidates the active session everywhere.
    user.password = await hashPassword(newPassword);
    user.refreshToken = undefined;
    await user.save();

    return {
      success: true,
      message: "Password changed. Please log in again.",
      data: null,
    };
  } catch (error) {
    throw handleServiceError(error, "Error in changePassword");
  }
};
