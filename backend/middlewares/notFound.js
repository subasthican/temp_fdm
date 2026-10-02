import ApiError from "../utils/apiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

const notFound = (req, res, next) => {
  next(
    ApiError.notFound(
      `Route not found: ${req.method} ${req.originalUrl}`,
      ERROR_CODES.ROUTE_NOT_FOUND,
    ),
  );
};

export default notFound;
