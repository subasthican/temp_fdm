import { ERROR_CODES } from "../constants/errorCodes.js";

// Operational error thrown by services. Always create through the
// static helpers so the status code and error code stay consistent.
class ApiError extends Error {
  constructor(statusCode, message, errorCode) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode || ERROR_CODES.INTERNAL_ERROR;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode) {
    return new ApiError(400, message, errorCode);
  }

  static unauthorized(message, errorCode) {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message, errorCode) {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message, errorCode) {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message, errorCode) {
    return new ApiError(409, message, errorCode);
  }

  static internal(message, errorCode) {
    return new ApiError(500, message, errorCode);
  }
}

export default ApiError;
