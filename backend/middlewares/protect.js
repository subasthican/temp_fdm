import jwt from "jsonwebtoken";

import config from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// Verifies the Bearer access token and attaches the user to req.user.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized(
        "Authentication required",
        ERROR_CODES.AUTH_TOKEN_MISSING,
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.unauthorized(
          "Session expired. Please log in again.",
          ERROR_CODES.AUTH_TOKEN_EXPIRED,
        );
      }

      throw ApiError.unauthorized(
        "Invalid authentication token",
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    const user = await User.findById(decoded.id);

    if (!user || user.isDeleted) {
      throw ApiError.unauthorized(
        "User no longer exists",
        ERROR_CODES.USER_NOT_FOUND,
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        "This account has been deactivated",
        ERROR_CODES.USER_INACTIVE,
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
