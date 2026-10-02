import config from "../config/env.js";
import ApiError from "../utils/apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

// Central error middleware — every controller forwards here via next(error).
// Always responds with the standard envelope: { success, message, errorCode }.
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";

    error = ApiError.conflict(
      `A record with this ${field} already exists`,
      ERROR_CODES.DUPLICATE_RESOURCE,
    );
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = ApiError.badRequest(
      "Invalid identifier format",
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (!(error instanceof ApiError)) {
    console.error("Unhandled error:", err);

    error = ApiError.internal(
      "Something went wrong. Please try again.",
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
